# EcoDash African Context Report

## Problem context

EcoDash models the challenge of delivering essential medical supplies to a rural clinic in South Africa. Rural communities depend on transport to access goods and services, and weak or unreliable transport links can make these deliveries more difficult. The World Bank's work on rural freight describes the importance of transport for moving goods and supporting rural communities (Sieber, 2009). South African last-mile delivery is also being studied in relation to electric vehicles, charging demand, and the potential value of decentralised solar energy (World Electric Vehicle Journal, 2025).

The simulation uses a small electric delivery vehicle. The player must drive to a clinic, avoid potholes and a fallen tree, watch the battery reserve, and recharge at a solar microgrid. A simulated load-shedding event makes the charging station temporarily unavailable. The simulation does not claim to reproduce a specific real route; it uses a fictional rural landscape to demonstrate the problem.

## How the mathematical model works

### Position and movement vectors

The vehicle has a position `(x, y)` and velocity `(vx, vy)`. Keyboard input changes the acceleration values. Acceleration is added to velocity, and velocity is added to position on each animation frame. Drag is applied by multiplying velocity by a value slightly below 1, which gradually slows the vehicle when no key is pressed.

The vehicle's speed is calculated with the Pythagorean formula:

`speed = √(vx² + vy²)`

If the speed is greater than the maximum allowed speed, the code scales both velocity components down. This keeps the vehicle from moving too quickly and avoids giving diagonal movement an unfair speed advantage.

### Direction and trigonometry

The vehicle's facing angle is calculated using `Math.atan2(vy, vx)`. This gives the angle between the direction of travel and the horizontal axis. The Canvas vehicle is rotated to match that angle. Sine and cosine can also be used to split a speed value into horizontal and vertical components:

`vx = speed × cos(angle)`

`vy = speed × sin(angle)`

### Battery and energy use

The battery begins at 100%. When the vehicle moves, the program subtracts a small amount from the battery based on the distance moved. Entering the solar microgrid zone adds battery charge, unless the simulated load-shedding event has disabled charging. These values are intentionally simplified game parameters and do not represent measured vehicle battery performance.

### Collision detection

Circular distance checks detect contact with potholes and the fallen tree. The distance between the centres of two circles is calculated using `Math.hypot()`. A collision occurs if the distance is smaller than the sum of their radii.

The clinic and solar charging area use axis-aligned bounding-box (AABB) collision detection. The program compares the left, right, top and bottom edges of the vehicle with the rectangle's edges.

### Animation

The simulation uses `requestAnimationFrame()` to repeatedly update the game state and redraw the Canvas. This method is intended for animation updates aligned with the browser's rendering process (MDN Web Docs, n.d.).

## Conclusion

EcoDash demonstrates how a simple interactive simulation can communicate the relationship between rural delivery, energy availability, navigation, and infrastructure. The model is educational rather than predictive. Further development could use measured road, travel-time, weather, and energy data to make its assumptions more realistic.

## References

MDN Web Docs (n.d.) *Canvas API*. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API (Accessed: 12 October 2026).

Sieber, N. (2009) *Freight transport for development toolkit: rural freight*. Washington, DC: World Bank. Available at: https://documents.worldbank.org/en/publication/documents-reports/documentdetail/140791468315544452 (Accessed: 12 October 2026).

World Electric Vehicle Journal (2025) ‘Simulating the electrification of Cape Town’s last-mile motorcycle fleet: Grid impact and resource requirements’, *World Electric Vehicle Journal*, 16(12), article 641. Available at: https://doi.org/10.3390/wevj16120641 (Accessed: 12 October 2026).

**Academic referencing reminder:** Your lecturer's brief requires at least two academic sources from STADIO Libraries. Search the STADIO Library for two relevant scholarly works and update the reference list and in-text citations with the exact details of the sources you actually consult.
