const camera = require('../index.js')('/dev/serial0', {
  onEmissivity: em => {
    console.log('Emissivity:', em)
  },
  onTemperatures: (temperatures, ambient) => {
    console.log('Temperatures: ', temperatures)
    console.log('Ambient:      ', ambient)
  }
})

// console.log(camera)

camera.automatic()
camera.emissivity()
camera.emissivity(0.95)
camera.emissivity()
camera.query()
