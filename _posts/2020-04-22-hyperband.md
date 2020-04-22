---
title: Budget computation in Hyperband may be undervalued
subtitle: Successive rounding of floating values adds up to a big difference
---

In the context of an internal AutoML seminar at Dataiku, my colleague [Simona Maggio](https://www.linkedin.com/in/simonamaggio/) and I had to read and present the reference paper of the Hyperband method. We were surprised to discover some inacurracies between the formulae in the paper and the proposed examples and implementations. We have not been able to find another blogpost reporting this error so I decided to report our findings on my blog.

{: .box-warning}
**Warning:** I want first to precise that what we found does not invalidate the method nor the results it obtained. The problem we found leads Hyperband to use a significantly lower budget than what it is allowed. As a result, the computation time of Hyperband is decreased along with its performance.

[Hyperband: A novel bandit-based approach to hyperparameter optimization.](Hyperband: A novel bandit-based approach to hyperparameter optimization.) — *Li L, Jamieson K, DeSalvo G, Rostamizadeh A, Talwalkar A* — JMLR 2018

# Preliminaries

Explaining the whole method is beyond the reach of this blog post. The reader is therefore advised to read the paper prior to this blogpost. This part gives the necessary intuition to understand the problem.

Hyperband is a method that aims at finding the best hyperparameters for a model. It relies on imbricated for loops. The outer loop iterates $s_{max}$ times and tests several models using different trade-offs between exploration and exploitation. The inner loop iterates $s$ times. It starts with $n$ models and prune them at each iteration.

If you have not read the paper, you can ignore the purpose of the variables, it is not important. **What is important to understand is that, given a budget $B$ for the whole procedure, Hyperband, will split this budget equally between each of the outer loops.** It is specified in the paper on page 7:

> Each bracket is designed to use approximately B total resources

Let us now have a look at the algorithm proposed in the paper. Note that the colored annotations have been added by me and are not part of the original paper.

![Hyperband](/img/hyperband.png){: .center-block :}

We need the following elements:
* $eta$, the pruning factor, is the factor of models eliminated at each bracket. For example, in the original successive halving procedure, one could start with 64 models, keep the best 32 models after the first bracket, then the best 16 models, etc.
* $n$, in blue, is the number of models considered at each Hyperband loop. Notice that the formula includes a division and a ceil operator to get an integer value. Following the preceding example, it would be 64.
* $n_i$, in red, is the number of models kept at iteration $i$. Notive that it is rounded using a floor operator.
* The unammed quantity in green is the number of models kept from iteration to the other. Again, it is rounded using a floor.

Since most of these values are rounded, we expect them not to be exact integers but fractions. The complicated operation used to compute $n$ is made to select the starting number of models that will consume as much budget as possible at each Hyperband loop.

So far, nothing suspicious!

# The example and the blog post

In order to ease the comprehension, the authors provide an extensive example with all values of $n$. I have added in red the budget used in each bracket.

![Hyperband](/img/hyperband_table.png){: .center-block :}

We notice that:
* All values of $n_i$ are perfect multiples of powers of 3. **This seems odd since all quantities highlighted in the algorithm use rounding operator to handle fractional values.** 
* The budget can be as low as 243 which is nearly half of the budget of 405 allowed to each bracket. The total budget is 1701 which is far from the 2025 allowed in this example.

We understand the origin of these value in a blogpost published by the authors that reveals the implementation used for the example. We are specially interested in the definition of $n$:

```python
n = int(ceil(int(B / max_iter / (s+1)) * eta ** s))
```

We recognize the ceiling operator. However, there is an additional rounding performed by the inner `int` casting. This rounding that is not present in the original formula enforces the valies of $n$ to be perfect multiples of 3 along the procedure.

Let us remove this cast and compute what would be the same values in that case.

| i   |    $$s = 4$$    |    $s = 3$    |    $s = 2$    |    $s = 1$    |    $s = 0$    |
| ^   | $n_i$ | $r_i$ | $n_i$ | $r_i$ | $n_i$ | $r_i$ | $n_i$ | $r_i$ | $n_i$ | $r_i$ |
| :-- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 0   | 81    | 1     | 34    | 3     | 15    | 9     | 8     | 27    | 5     | 81    |
| 1   | 27    | 3     | 11    | 9     | 5     | 27    | 2     | 81    |       |       |
| 2   | 9     | 9     | 3     | 27    | 1     | 81    |       |       |       |       |
| 3   | 3     | 27    | 1     | 81    |       |       |       |       |       |       |
| 4   | 1     | 81    |       |       |       |       |       |       |       |       |
| --- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
|     |  >    |  405  |  >    |  363  |  >    |  351  |  >    |  378  |  >    |  405  |

The total budget is now 1902 which is closer to the ideal of 2025. One important thing to notice is that we have value rounding from one line to the other. If you take a look at the values of $n_i$ when $s = 3$, it starts at 34 and drops to 11. We are now using the floor operator of the green variable in the algorithm.

However, the story does not end here. In fact, even in this configuration, some mistakes are easy to spot. For example, regarding the column where $s = 3$, we notice that we can perfectly start with 35 models instead of 34. The cost of this bracket would then be 366 which is closer to our objective of 405.

# A better resource allocator

The reason why this estimation misses some obvious wins is because the formula used to compute $n$, highlighted in red in the algorithm, is trying to make an estimation of the maximum number of models to be processed in an analytical way. Since the successive rounding operations are hard to take into account in such a theoretical framework, they just *discard* the reminders. However, the accumulation of reminders can lead to a better resource usage.

Let us forget about finding a perfect formula for $n$. I propose an iterative algorithm to be able to find the perfect resource allocation in this case. This algorithm:
* Needs to know how many lines will be computed
* ... 
