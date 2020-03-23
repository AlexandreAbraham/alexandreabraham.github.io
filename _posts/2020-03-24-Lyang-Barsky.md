---
layout: post
title: Line Clipping&#58; The Algorithmic Beauty of Liang-Barsky Algorithm
subtitle: How a geometric problem can find a beautiful coding solution
tags: [Ugly code]
---

I recently stumbled upon a very simple problem: I had to compute the intersection points of a line — actually, an affine function — and a rectangle. For that kind of simple geometric problem, I do not rush toward Google. I prefer to try to solve it myself, to keep my problem-solving mind sharp!

I made some drawings, found the corner cases, then an algorithm, and it was finished in no time.

I found the algorithm was simple and elegant so I decided to check how it compared to other methods. Obviously google led me to a [Wikipedia list of algorithms solving this problem]. I discovered that my solution was actually very close to [Liang-Barsky algorithm](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm) apart from the fact that I was working with an inifinite line when other methods were dealing with finite segments.

I was however surprised to see that the explanation of the algorithm was way more complicated that the simple intuition I used to create my algorithm. Here is an attempt to explain how I see Liang-Barsky algorithm, and how it can be coded with 3 lines of Python.

# The problem

Let's put some letters on the problem. I have an affine function that can be written:

$f(x) = ax + b$
