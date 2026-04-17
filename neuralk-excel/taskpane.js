/* global Office, Excel */

var API_URL = "https://neuralk-excel-proxy.alexandre-abraham.workers.dev";
var STORAGE_KEY = "neuralk_api_key";
var MAX_RETRIES = 3;

var elXTrain, elYTrain, elXTest, elOutput;
var elApiKey, elModel, elReturnProba, elBtnPredict, elStatus;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

Office.onReady(function (info) {
  if (info.host === Office.HostType.Excel) {
    initUI();
  }
});

function initUI() {
  elXTrain = document.getElementById("range-xtrain");
  elYTrain = document.getElementById("range-ytrain");
  elXTest = document.getElementById("range-xtest");
  elOutput = document.getElementById("range-output");
  elApiKey = document.getElementById("api-key");
  elModel = document.getElementById("model-select");
  elReturnProba = document.getElementById("return-proba");
  elBtnPredict = document.getElementById("btn-predict");
  elStatus = document.getElementById("status");

  // Restore saved API key
  try {
    var savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) elApiKey.value = savedKey;
  } catch (e) { /* localStorage may be unavailable */ }

  // Save API key on change
  elApiKey.addEventListener("input", function () {
    try { localStorage.setItem(STORAGE_KEY, elApiKey.value); } catch (e) {}
  });

  // Disable proba checkbox when regression is selected
  var radios = document.querySelectorAll('input[name="task"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener("change", function () {
      var isClassification = document.querySelector('input[name="task"]:checked').value === "classification";
      elReturnProba.disabled = !isClassification;
      if (!isClassification) elReturnProba.checked = false;
    });
  }

  elBtnPredict.disabled = false;
  elBtnPredict.addEventListener("click", predict);
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

function setStatus(message, type) {
  elStatus.textContent = message;
  elStatus.className = "status-area";
  if (type) elStatus.classList.add(type);
}

// ---------------------------------------------------------------------------
// Excel range read/write
// ---------------------------------------------------------------------------

function readRange(rangeAddress) {
  return Excel.run(function (context) {
    var sheet = context.workbook.worksheets.getActiveWorksheet();
    var range = sheet.getRange(rangeAddress);
    range.load("values");
    return context.sync().then(function () {
      return range.values;
    });
  });
}

function writeResults(predictions, probabilities, outputAddress, xTestAddress) {
  return Excel.run(function (context) {
    var sheet = context.workbook.worksheets.getActiveWorksheet();
    var startRange;

    if (outputAddress) {
      startRange = sheet.getRange(outputAddress);
    } else {
      var xTestRange = sheet.getRange(xTestAddress);
      startRange = xTestRange.getLastColumn().getOffsetRange(0, 1);
    }

    var rows = predictions.length;
    var data = [];

    if (probabilities && probabilities.length === rows) {
      for (var i = 0; i < rows; i++) {
        var row = [predictions[i]];
        if (Array.isArray(probabilities[i])) {
          row = row.concat(probabilities[i]);
        } else {
          row.push(probabilities[i]);
        }
        data.push(row);
      }
    } else {
      for (var j = 0; j < rows; j++) {
        data.push([predictions[j]]);
      }
    }

    var cols = data[0].length;
    var outRange = startRange.getResizedRange(rows - 1, cols - 1);
    outRange.values = data;

    return context.sync();
  });
}

// ---------------------------------------------------------------------------
// API payload & call
// ---------------------------------------------------------------------------

function buildPayload(xTrain, yTrain, xTest, model, returnProba) {
  var yFlat = [];
  for (var i = 0; i < yTrain.length; i++) {
    yFlat.push(yTrain[i][0]);
  }
  return {
    model: model,
    train: { X: xTrain, y: yFlat },
    X_test: xTest,
    return_proba: returnProba
  };
}

function callAPI(payload, apiKey) {
  var attempt = 0;

  function tryFetch() {
    attempt++;
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (response.ok) return response.json();

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        var delay = Math.pow(2, attempt) * 500;
        setStatus(
          "Server error (HTTP " + response.status + "). Retrying in " +
          (delay / 1000) + "s... (attempt " + attempt + "/" + MAX_RETRIES + ")",
          "working"
        );
        return new Promise(function (resolve) {
          setTimeout(resolve, delay);
        }).then(tryFetch);
      }

      return response.text().then(function (body) {
        throw new Error("API error (HTTP " + response.status + "): " + body);
      });
    });
  }

  return tryFetch();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateNumeric(data, label) {
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      var v = data[i][j];
      if (v === "" || v === null || v === undefined) {
        throw new Error(label + ": empty cell at row " + (i + 1) + ", col " + (j + 1));
      }
      if (typeof v !== "number" || isNaN(v)) {
        throw new Error(label + ': non-numeric value "' + v + '" at row ' + (i + 1) + ", col " + (j + 1));
      }
    }
  }
}

function validate(xTrain, yTrain, xTest) {
  if (!xTrain.length) throw new Error("X_train is empty.");
  if (!yTrain.length) throw new Error("y_train is empty.");
  if (!xTest.length) throw new Error("X_test is empty.");

  if (xTrain.length !== yTrain.length) {
    throw new Error("Row mismatch: X_train has " + xTrain.length + " rows, y_train has " + yTrain.length);
  }
  if (xTrain[0].length !== xTest[0].length) {
    throw new Error("Column mismatch: X_train has " + xTrain[0].length + " cols, X_test has " + xTest[0].length);
  }
  if (yTrain[0].length !== 1) {
    throw new Error("y_train must be a single column (got " + yTrain[0].length + ")");
  }

  validateNumeric(xTrain, "X_train");
  validateNumeric(yTrain, "y_train");
  validateNumeric(xTest, "X_test");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function predict() {
  var xTrainAddr = elXTrain.value.trim();
  var yTrainAddr = elYTrain.value.trim();
  var xTestAddr = elXTest.value.trim();
  var outputAddr = elOutput.value.trim();
  var apiKey = elApiKey.value.trim();
  var model = elModel.value;
  var returnProba = elReturnProba.checked;

  if (!xTrainAddr || !yTrainAddr || !xTestAddr) {
    setStatus("Please fill in X_train, y_train, and X_test ranges.", "error");
    return;
  }
  if (!apiKey) {
    setStatus("Please enter your API key.", "error");
    return;
  }

  elBtnPredict.disabled = true;

  var xTrainData, yTrainData, xTestData;
  var step = "";

  Promise.resolve()
    .then(function () {
      step = "Reading X_train (" + xTrainAddr + ")";
      setStatus(step + "...", "working");
      return readRange(xTrainAddr);
    })
    .then(function (data) {
      xTrainData = data;
      step = "Reading y_train (" + yTrainAddr + ")";
      setStatus(step + "...", "working");
      return readRange(yTrainAddr);
    })
    .then(function (data) {
      yTrainData = data;
      step = "Reading X_test (" + xTestAddr + ")";
      setStatus(step + "...", "working");
      return readRange(xTestAddr);
    })
    .then(function (data) {
      xTestData = data;

      step = "Validating";
      setStatus(step + "...", "working");
      validate(xTrainData, yTrainData, xTestData);

      step = "Calling API";
      setStatus(
        "Calling neuralk API (" + model + ")...\n" +
        "Train: " + xTrainData.length + " rows x " + xTrainData[0].length + " features\n" +
        "Test: " + xTestData.length + " rows",
        "working"
      );

      var payload = buildPayload(xTrainData, yTrainData, xTestData, model, returnProba);
      return callAPI(payload, apiKey);
    })
    .then(function (result) {
      var predictions = result.predictions || [];
      var probabilities = returnProba ? (result.probabilities || null) : null;

      if (!predictions.length) {
        throw new Error("API returned no predictions. Response: " + JSON.stringify(result));
      }

      step = "Writing results";
      setStatus("Writing " + predictions.length + " predictions...", "working");
      return writeResults(predictions, probabilities, outputAddr || null, xTestAddr);
    })
    .then(function () {
      setStatus("Done. Predictions written successfully.", "success");
    })
    .catch(function (err) {
      setStatus("Error at step [" + step + "]: " + err.message, "error");
    })
    .then(function () {
      elBtnPredict.disabled = false;
    });
}
