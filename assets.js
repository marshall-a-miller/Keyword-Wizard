
// Determines whether in developer mode or not based on file structure
function isDev() {

  // Assets will be in a non-root folder in production
  return fs.existsSync('assets')

}

// Returns the root directory of the application
function findRoot() {
  if (dev) {

    // Developer mode means all files are based in root
    return ''

  } else {

    // Production files in Resources
    return process.resourcesPath + '/app/'

  }
}

// Reads the files in a directory
function readDir(dir) {

  return fs.readdirSync(rootDir + dir)
}

// Reads a regular file
function readFile(path) {

  return fs.readFileSync(rootDir + path, 'utf8')
}

// Reads JSON file
function readJSON(path) {

  return JSON.parse(readFile(path))
}

// Writes to JSON file
function writeJSON(path, obj) {

  fs.writeFileSync(rootDir + path, JSON.stringify(obj), 'utf8')
}

// Delete a file
function deleteFile(path) {

  fs.unlinkSync(rootDir + path)
}

// Sorts values of dictionary
function order(obj) {
    items = Object.keys(obj).map(function(key) {
        return [key, obj[key]]
    })
    items.sort(function(first, second) {
        return second[1] - first[1]
    })
    sorted_obj={}
    $.each(items, function(k, v) {
        use_key = v[0]
        use_value = v[1]
        sorted_obj[use_key] = use_value
    })
    return(sorted_obj)
}
