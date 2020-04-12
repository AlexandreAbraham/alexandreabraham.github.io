# Imports

import pandas as pd
from matplotlib import pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation


# For the animation, we need to pre-create most elements

fig = plt.figure(figsize=(8, 8))
plt.xlim(30, 80)
plt.ylim(1, 20000)
plt.xticks([])
plt.ylabel('Death count')
plt.grid()
text = plt.text(60, 20, '', fontsize=14)


# Declare necessary data

def load_data_for(country):
    mask = np.logical_and(deaths['Country/Region'] == country,
                          deaths['Province/State'].isnull())
    return deaths[mask].values[0, 4:]

countries = ['France', 'Switzerland', 'Netherlands', 'Italy',
    'United Kingdom', 'Spain']

populations = [8.57, 66.99, 17.18, 60.48, 66.65, 46.94]

deaths = pd.read_csv('time_series_covid19_deaths_global.csv')
lines = []
datas = []

for country in countries:
    ln, = plt.plot([], [], '-o', linewidth=2, label=country)
    lines.append(ln)
    datas.append(load_data_for(country))


# General plotting function

def plot_all(death_count):
    # Compute the reference
    offset = None
    for country, line, data in zip(countries, lines, datas):
        
        index = np.where(data >= death_count)[0][0]
        if not offset:
             offset = index
        x_data = np.arange(data.shape[0]) + offset - index
        line.set_data(x_data, data)
    text.set_text('Lines aligned on {} deaths'.format(death_count))
    return lines + [text]

ani = FuncAnimation(fig, plot_all, frames=[2, 10, 20, 50, 75, 100],
                    blit=True, interval=1000)

plt.yscale("log")
plt.legend()
plt.tight_layout()

ani.save('death_threshold.gif', writer='imagemagick')
