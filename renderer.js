// This file is required by the index.html file and will
// be executed in the renderer process for that window.

// All of the Node.js APIs are available in this process.
const $ = require('jquery')
const fs = require('fs')
const clipboard = require('clipboardy')

// Import settings
let settings = JSON.parse(fs.readFileSync(`${process.resourcesPath}/app/assets/config-files/settings.json`, 'utf8'))

// Import stopWords list
const stopWords = fs.readFileSync(`${process.resourcesPath}/app/assets/config-files/ignore.txt`, 'utf8').split(/\s+/)

$(document).ready(function() {

  // Read all files in files directory and load tabs
  let allFiles = fs.readdirSync(`${process.resourcesPath}/app/assets/files`)
  for (file in allFiles) {
    addTab(allFiles[file].replace('.json', ''))
  }

  // On focus of search delete value if value is search documents
  $('#searchDocsField').focus(function() {
    if (document.getElementById('searchDocsField').value == 'Search Documents') {
      document.getElementById('searchDocsField').value = ''
    }

    // Set no active tabs
    $('#addedDocs').children().css('background-color', '')
  })

  // On unfocus of search if value is nothing replace with search documents
  $('#searchDocsField').blur(function() {
    if (document.getElementById('searchDocsField').value == '') {
      document.getElementById('searchDocsField').value = 'Search Documents'
    }
  })

  // ONCHANGE FUNCTION FOR SEARCH INPUT VALUE TO DISPLAY/HIDE FILES
  $('#searchDocsField').on('keyup', function() {
    let searchVal = document.getElementById('searchDocsField').value
    if (searchVal != '' && searchVal != 'Search Documents') {

      // Filter names of documents
      $('#addedDocs').children().each(function() {
        if ($(this).text().includes(searchVal)) {
          $(this).css({'display': 'block'})
        } else {
          $(this).css({'display': 'none'})
        }
      })
    } else {

      // Display everything if no search terms are added
      $('#addedDocs').children().each(function() {
        $(this).css({'display': 'block'})
      })
    }
  })

  // Delete a page
  $(document).on('keydown', function(evt) {

    // If backspace or delete pressed
    if (evt.which == 46 || evt.which == 8) {

      // Check for active tab
      $('#addedDocs').children().each(function() {

        if ($(this).css('background-color') == 'rgb(34, 168, 245)') {
          fs.unlink(`${process.resourcesPath}/app/assets/files/${$(this).text()}.json`, function (err) {
            if (err) throw err
          })
          $(this).remove()
          $('#stats').empty()
          $('#docTitle').text(' ')
        }
      })
    }
  })
})

// Shows the settings
function showSettings() {
  $('#docTitle').text('Settings - only maintained by newly imported files')
  $('#stats').empty()
  $('#settings').css({'background-color': '#22a8f5'})
  $('#addedDocs').children().css('background-color', '')
  $('#stats').text('\n')

  // Load Settings
  for (setting in settings) {
    $('#stats').append(`<span>${setting[0].toUpperCase() + setting.replace(/([A-Z])/g, ' $1').slice(1)}: <input type="number" id="${setting}" value="${settings[setting]}" onchange="updateSettings(this.id)"></span>\n\n`)
  }
}

// Updates the settings
function updateSettings(setting) {
  settings[setting] = document.getElementById(setting).value
  fs.writeFile(`${process.resourcesPath}/app/assets/config-files/settings.json`, JSON.stringify(settings), 'utf8', function(err) {
    if (err) throw err
  })
}

// Copies all keywords
function copyAll() {
  $('#addedDocs').children().css('background-color', '')

  // Cycle through all files
  let allFiles = fs.readdirSync(`${process.resourcesPath}/app/assets/files`)
  keywordString = ''
  for (name in allFiles) {

    // Loads file
    let keywords = JSON.parse(fs.readFileSync(`${process.resourcesPath}/app/assets/files/${allFiles[name]}`, 'utf8'))

    // Creates CSV
    for (word in keywords[allFiles[name].replace('.json', '')]) {
      keywordString += word + ', '
    }

  }

  // Removes extra ', '
  keywordString = keywordString.slice(0, -2)

  // Copy text to clipboard
  clipboard.writeSync(keywordString)
}

// Triggers on #addDocs clicked
function addFiles() {

  // Artificially clicks invisible file input for user and stops bubbling
  $('#fileInput').click(function(e) { e.stopPropagation() })
  $('#fileInput').trigger('click')

  // When a file is inputted and the value of the field changes
  $('#fileInput').change(function() {

    // Put all of the imported files into an array
    let importedFiles = $('#fileInput')[0].files

    // Cycle through the files
    for (let file = 0; file < importedFiles.length; file++) {

      // If the file has any contents
      if (importedFiles[file]) {

        // Record the name of the file
        let fileName = importedFiles[file].name

        // Create new built-in FileReader Object
        let reader = new FileReader()
        reader.readAsText(importedFiles[file], "UTF-8")

        // Once the file has loaded as an event
        reader.onload = function (evt) {

          // Prepare loaded text and remove scripts, styles, and images that may cause issues
          let loadedText = evt.target.result.replace(/<script[^>]*?>.*?<\/script>/gs, '')
          loadedText = loadedText.replace(/<style[^>]*?>.*?<\/style>/gs, '')
          loadedText = loadedText.replace(/<img[^>]*?>/gs, '')

          // Set the text to an HTML object so we can strip the content text
          let htmlCode = document.createElement('span')
          htmlCode.setAttribute('id', 'htmlCode')
          htmlCode.innerHTML = loadedText
          allWords = htmlCode.innerText.split(/\W+/)

          // First and last item are always "" so pop them out
          allWords.shift()
          allWords.pop()

          // Makes all words lowercase and removes numbers
          allWords = allWords.map(word => word.toLowerCase())
          allWords = allWords.filter(word => /\D+?/.test(word))

          // Remove stop words from list
          stopWords.forEach(stopWord => {
            // Filter each stop word from content word list
            allWords = allWords.filter(word => word.toLowerCase() != stopWord)
          })

          // Creates a block of text containing all words and phrases
          pageText = allWords.join(' ')

          // Create keyword list
          let keywords = {}

          // Find phrases starting with largest
          for (let phraseLength = settings.maxPhraseLength; phraseLength > settings.minPhraseLength - 1; phraseLength--) {

            // For each index position
            for (let i = 0; i < allWords.length - phraseLength; i++) {

              // Assemble phrase
              let phrase = ''
              for (let j = 0; j < phraseLength; j++) {
                phrase += allWords[i + j] + ' '
              }
              phrase = phrase.slice(0, -1)

              // Check count of phrase in string
              let gPhrase = new RegExp(' ' + phrase + ' ', 'g')
              let keywordCount = (pageText.match(gPhrase) || []).length
              if (keywordCount > settings.minimumOccurences - 1) {

                // Add keyword to list and remove found phrases
                keywords[phrase] = keywordCount
                pageText.replace(phrase, '')
                pageText.replace('  ', ' ')
                allWords = pageText.split(' ')
              }
            }
          }

          // Order keywords
          keywords = order(keywords)

          // Find phrases that are part of another phrase
          for (word in keywords) {

            // Check if it's a single word
            //if (!word.includes(' ')) {

              // Test word against every other word
              for (testWord in keywords) {
                if (testWord.includes(word) && testWord != word) {
                  delete keywords[word]
                }
              }
            //}
          }

          // Turn values to dicts
          for (key in keywords) {
            keywords[key] = {"count": keywords[key]}
          }

          // Append data to dictionary
          let fullKeywords = {}
          fullKeywords[fileName] = keywords

          // Write the json file
          fs.writeFile(`${process.resourcesPath}/app/assets/files/${fileName}.json`, JSON.stringify(fullKeywords), 'utf8', function(err) {
            if (err) throw err
          })

          // Check if document was added before
          tabNames = []
          $('#addedDocs').children().each(function() {
            tabNames.push($(this).text())
          })
          if (!tabNames.includes(fileName)) {

            // Call function to append words to side tab
            addTab(fileName)
          }

        }

        // Report error reading file
        reader.onerror = function (evt) {

          // Handling
          console.log(evt)
        }
      }
    }

  })
}

// Add file tab to sideBar
function addTab(name) {
  $('#addedDocs').prepend(`<div class="sideLink" id="${name}" onclick="displayKeywords(this.id)">${name}</div>`)
}

// Display the selected file's information
function displayKeywords(idTag) {

  // Grab keywords from proper file
  let keywords = JSON.parse(fs.readFileSync(`${process.resourcesPath}/app/assets/files/${idTag}.json`, 'utf8'))

  // Set document title
  $('#docTitle').text(idTag)

  // Display keywords
  $('#stats').empty()
  for (word in keywords[idTag]) {

    // Create keyword tab element
    individualKeyword = `<span class="strikeable" onclick="deleteWord('${word}', '${idTag}', this)">${word
      + ': ' + keywords[idTag][word].count + '\n'}</span>`

    // Append keywords as span
    $('#stats').append(individualKeyword)
  }

  // Change the selected tab's color to active
  $('#settings').css({'background-color': ''})
  $('#addedDocs').children().css('background-color', '')
  document.getElementById(idTag).style.backgroundColor = '#22a8f5'
}

// Deletes a target word from json file
function deleteWord(word, file, elem) {

  // Grab keywords from proper file
  let keywords = JSON.parse(fs.readFileSync(`${process.resourcesPath}/app/assets/files/${file}.json`, 'utf8'))

  // Remove word from file
  delete keywords[file][word]

  // Write the json file
  fs.writeFile(`${process.resourcesPath}/app/assets/files/${file}.json`, JSON.stringify(keywords), 'utf8', function(err) {
    if (err) throw err
  })

  // Delete the target element
  elem.remove()
}

// Sorts values of dictionary
function order(obj) {
    items = Object.keys(obj).map(function(key) {
        return [key, obj[key]];
    });
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    sorted_obj={}
    $.each(items, function(k, v) {
        use_key = v[0]
        use_value = v[1]
        sorted_obj[use_key] = use_value
    })
    return(sorted_obj)
}
