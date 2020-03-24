---
layout: post
title: Line Clipping&#58; The Algorithmic Beauty of Liang-Barsky Algorithm
subtitle: How a geometric problem can find a beautiful coding solution
tags: [Ugly code]
---

I recently stumbled upon a very simple problem: I had to compute the intersection points of a line — actually, an affine function — and a rectangle. For that kind of simple geometric problem, I do not rush toward Google. I prefer to try to solve it myself, to keep my problem-solving mind sharp!

I made some drawings, found the corner cases, then an algorithm, and it was finished in no time.

I found the algorithm was simple and elegant so I decided to check how it compared to other methods. Obviously google led me to a [Wikipedia list of algorithms solving this problem](https://en.wikipedia.org/wiki/Line_clipping). I discovered that my solution was actually very close to [Liang-Barsky algorithm](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm) apart from the fact that I was working with an inifinite line when other methods are dealing with finite segments.

I was however surprised to see that the explanation of the algorithm was way more complicated that the simple intuition I used to create my algorithm. Here is an attempt to explain how I see Liang-Barsky algorithm, and how it can be coded with 3 lines of Python.

{: .box-note}
**Note:** That kind of geometric operation is typically used in graphics engine. In this context, the implementation needs to be as efficient as possible and all kind of tricks can be used to make it faster. My goal in this post is not to adress this case but to find the simplest intuition and the clearest code.

# The problem

Let's put some letters on the problem. I have an affine function parametrized by $a$ and $b$ that can be written as:

$$f(x) = ax + b$$

And a rectangle define by two points: $[(x_{min}, y_{min}), (x_{max}, y_{max})]$.

![Intersection between line and rectangle](img/liang.png){: .center-block :}

On the figure, we see that the black line (our affine function) intersects with the rectangle when it crosses the vertical line $x_{min}$ and the horizontal line $y_{max}$. The tricky point is that our function can cross any of the sides of the rectangle and therefore we need to determine the ones in which we are interested. This is what the Liang-Barsky algorithm does.

{: .box-warning}
**Warning:** A perfectly horizontal or vertical line will be parallel to some of the rectangle sides and therefore the method described in this post may not work. Those simple cases are traditionally treated first because they are easy to spot and the solution is simple.

# The algorithm

If we consider our function infinite, it will always cross all the sides of the rectangles — if we consider them infinite. We have therefore 4 intersections, with $x_{min}$, $y_{min}$, $x_{max}$, and $y_{max}$.

As it happens, if we consider the intersectons from left to right in term of the $x$-axis, the first and last ones are always outside of the rectangle. The points we are looking for are the second and thirs ones.

And that's it!

{: .box-note}
**Note:** This is if we assume that the line crosses the rectangle. If we want to know if the line crosses the rectangle, there is a simple trick too. If we look at the first two points, sorted from left to right, one of them must be a $y$-line, and the other an $x$-line. It is easy to see again: if the line crosses the two $x$-lines or $y$-lines first, you can see that it will note be able to get back to the domain occupied by the rectangle.

# The code

Let's now code it! Using the sorted function of Python, this is really simple!

```python
def line_x_rectangle(a, b, x_min, y_min, x_max, y_max):

    # We compute the intersection of the line with the rectangle (x, y, axis)
    p1, p2 = (x_min, a * x_min + b, 'x'), (x_max, a * x_max + b, 'x'), 
    p3, p4 = ((y_min - b) / a, y_min, 'y'), ((y_max - b) / a, y_max, 'y')
    # Python sorts them using the first key
    p1, p2, p3, p4 = sorted([p1, p2, p3, p4])

    # We can check if there is an intersection, otherwise we return the points.
    if p1[3] == p2[3]:
        return None
    return p2[:2], p3[:2]
```

Now that you have this intuition in mind, I invite you to take a look at the [Wikipedia implementation](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm) and it should appear clearer. Do not hesitate also to compare this explanation to [other available on the web](https://gist.github.com/ChickenProp/3194723), it is always better to find the explanation that better suits you.