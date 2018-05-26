# AmnesiaRL
RL with room-based map generation and memory loss features. Most of the code lies atm. on manipulating 2d-arrays for room generation. [ROT.js](http://ondras.github.io/rot.js/hp/) is used atm. for UI, FOV calculations and RNG.
![alt text](../master/AmnesiaRL.gif?raw=true "Current gameplay")

### Current features
Just a demo implementing some core features:
* Map generation based on given room types and layouts
* Portal doorways connecting map rooms that are not neighbours
* Memory based map drawing slowly fading away
* Endless amount of floors connected with seamless stairs
* Dummy monsters and coins to have some gaming feeling

### TODO features (maybe someday)
Actual gameplay 
* Forgetting and re-generating rooms not visible anymore
* More complex combat system featuring different ways of hitting and evading attacks
* Items, skills, leveling system etc.
