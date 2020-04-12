# Imports

import pandas as pd
from matplotlib import pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation


# For the animation, we need to pre-create most elements

fig = plt.figure(figsize=(8, 8))
plt.xlim(20, 100)
plt.ylim(0.01, 1000)
plt.xticks([])
plt.ylabel('Death count')
plt.grid()
text = plt.text(55, 0.03, '', fontsize=14)


# Declare necessary data

def load_data_for(country):
    mask = np.logical_and(deaths['Country/Region'] == country,
                          deaths['Province/State'].isnull())
    return deaths[mask].values[0, 4:]

countries = ['France', 'Switzerland', 'Netherlands', 'Italy',
    'United Kingdom', 'Spain']

populations = [66.99, 8.57, 17.18, 60.48, 66.65, 46.94]

deaths = pd.read_csv('time_series_covid19_deaths_global.csv')
lines = []
datas = []

for country, pop in zip(countries, populations):
    ln, = plt.plot([], [], '-o', linewidth=2, label=country)
    lines.append(ln)
    datas.append(load_data_for(country) / pop)


# General plotting function

def plot_all(ratio):
    # Compute the reference
    offset = None
    for country, line, data, pop in zip(countries, lines, datas, populations):
        
        index = np.where(data >= ratio * pop)[0][0]
        if not offset:
             offset = index
        x_data = np.arange(data.shape[0]) + offset - index
        line.set_data(x_data, data)
    text.set_text('Lines aligned on {} deaths / Mhbts'.format(ratio))
    return lines + [text]

ani = FuncAnimation(fig, plot_all, frames=[0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
                    blit=True, interval=1000)

plt.yscale("log")
plt.legend()
plt.tight_layout()

ani.save('death_ratio.gif', writer='imagemagick')
