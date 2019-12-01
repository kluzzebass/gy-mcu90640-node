# gy-mcu90640-node

Handles serial communication with the MLX90540 based GY-MCU90640 infrared camera module. Only ever tested on Raspberry Pi.

Take a look at this article for some background information about the module in question, wiring etc.:

https://habr.com/en/post/441050/


Usage:

```
// Connect to the camera on /sev/serial0 (on Raspberry Pi)
const camera = require('gy-mcu90640-node')('/dev/serial0', {
	// Callback for reading the current emissivity
  onEmissivity: em => {
    console.log('Emissivity:', em)
  },
	// Callback for handling the temperature data
  onTemperatures: (temperatures, ambient) => {
    console.log('Temperatures: ', temperatures)
    console.log('Ambient:      ', ambient)
  }
})

// Set target emissivity.
setTimeout(camera.emissivity, 0, 0.95)

// Request a single frame after 100s (the module needs a bit of time to react)
setTimeout(camera.query, 100)

// Request emissivity
setTimeout(camera.emissivity, 1000)

// Switch to contonuous reading
setTimeout(camera.automatic, 2000)

// Terminate automatic reading by requesting a single frame
setTimeout(camera.query, 5000)

// Terminate the process
setTimeout(() => process.exit(0), 12000)
```
