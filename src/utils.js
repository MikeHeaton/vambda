function getText () {
  var newName = window.prompt('name:', '')
  keysPressed = new Set()
  return newName
}

module.exports = {
  getText
}
