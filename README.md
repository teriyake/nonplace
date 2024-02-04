# nonplace 

A javascript program that generates plausible maps using a simple implementation of the marching sqaures algorithm.   
  
![example map 1](https://github.com/teriyake/nonplace/blob/49734b50028ea67a7e26db923aaefb159ce0b529/examples/nonplace-6.png)  

![example map 2](https://github.com/teriyake/nonplace/blob/49734b50028ea67a7e26db923aaefb159ce0b529/examples/nonplace-8.png)  

The input field for the marching squares is a fractal noise grid constructed from a 2D simplex noise (using [this](https://github.com/blindman67/SimplexNoiseJS) js library). The fractal noise function takes `scale`, `octaves`, and `persistence` as its parameters. `Scale` affects the size of the noise features, and lowering it usually results in more intricate contour lines. However, instead of directly drawing the land masses, my implementation draws the negative spaces because I wanted random textures for the background (there might be more efficient ways to do this... ), so the effect of `scale` is inverted. For both `persistence` and `octaves`, a higher value produces more detailed contours, and a lower value results in smoother lines. There is another parameter `threshold`, which is used for the marching squares algorithm. `Threshold` determines which cells in the input noise grid are included in the binary map, and a higher value normally results in more details. But in my implementation, the effect of `threshold` is inverted just like with `scale` since the contours are "drawn" as negative spaces.  

![a screenshot of the web interface](https://github.com/teriyake/nonplace/blob/438d718a4e14368ee1078fbf74d6efd3a7f82155/Screenshot%202024-02-04%20at%2017.32.29.png)  

Play around with the parameters and make your own maps [here](https://nonplace.vercel.app/) 🗺️
