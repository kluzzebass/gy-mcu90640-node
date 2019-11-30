
const camera = require('../index.js')('/dev/serial0', {
  updateFrequency: 1,
  onEmissivity: em => {
    console.log('Emissivity:', em)
  },
  onTemperatures: (temperatures, ambient) => {
    console.log('Temperatures: ', temperatures)
    console.log('Ambient:      ', ambient)
  }
})

setTimeout(camera.query, 1)
setTimeout(camera.emissivity, 500, 0.95)
setTimeout(camera.emissivity, 1000)
setTimeout(camera.query, 1500)
setTimeout(camera.emissivity, 2000, 0.50)
setTimeout(camera.emissivity, 2500)
setTimeout(camera.changeUpdateFrequency, 3000, 8)
setTimeout(camera.automatic, 3500)

setTimeout(camera.query, 10000)

setTimeout(() => {
  process.exit(0)
}, 12000)