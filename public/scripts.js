const mockData = {
    "name": "NotPhil",
    "id": "8OZvbT9m0hYiD1n-AAAJ",
    "clover": {
        "top-left": {
            "id": 108,
            "words": [
                "Camera",
                "Bench",
                "Patron",
                "Stud"
            ],
            "offset": 1
        },
        "top-right": {
            "id": 161,
            "words": [
                "Ground",
                "Asia",
                "Glove",
                "Shape"
            ],
            "offset": 2
        },
        "bottom-left": {
            "id": 116,
            "words": [
                "Union",
                "Axe",
                "Board",
                "Button"
            ],
            "offset": 3
        },
        "bottom-right": {
            "id": 155,
            "words": [
                "Loop",
                "Stylist",
                "Pyramid",
                "Club"
            ],
            "offset": 2
        },
        "extra": {
            "id": 107,
            "words": [
                "Mother",
                "Match",
                "Rope",
                "Paradise"
            ],
            "offset": 0
        }
    },
    "disconnected": false,
    "answers": {
        clueKey: {
            'top': "poiu",
            'bottom': "lkjh",
            'right': ",nmb",
            'left': "hgfd",
        },
        "poiu": ['Bench', 'Glove'],
        "lkjh": ['Loop', 'Axe'],
        ",nmb": ['Shape', 'Club'],
        "hgfd": ['Board', 'Camera'],
    }
}


$(function () {
    const socket = io()
    const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left']    
    const shuffle = arr => {
        var m = arr.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        return arr;
    }
    let cards = {}
    let clues  = {
        right: '',
        left: '',
        bottom: '',
        top: '',
    }
    let guessData
    let isLastGuess
    let animInterval

    function showAlert(str) {
        $('.alert-bar').html(str).css('opacity', '1')
        setTimeout(() => $('.alert-bar').css('opacity', '0'), 3000)
    }

    function updateButtons(redrawFunc) {
        $('.card-rotate-button').on('click', () => {
            $('.card-rotate-button').off()
            $('.clover-container').css('transform', `rotate(90deg)`)

            // update cards object
            let newCards = {
                'top-left': cards['bottom-left'],
                'top-right': cards['top-left'],
                'bottom-left': cards['bottom-right'],
                'bottom-right': cards['top-right'],
            }
            if (cards.unplaced) newCards.unplaced = cards.unplaced
            cards = newCards
            // update clues object
            if (guessData) {
                let temp = clues.right
                clues.right = clues.top
                clues.top = clues.left
                clues.left = clues.bottom
                clues.bottom = temp
            } else {
                let currClues = $('.clue-input').toArray().map(v => $(v).val())
                clues  = {
                    right: currClues[0],
                    left: currClues[1],
                    bottom: currClues[2],
                    top: currClues[3],
                }
            }
            corners.forEach(v => cards[v].length ? cards[v].unshift(cards[v].pop()) : null)
            setTimeout(redrawFunc, 200)
        })

        $('.submit-clues').on('click', submitClues)
    }

    function updateCardArrows() {
        $('.corner-arrow').on('click', function() {
            let arrow = $(this).attr('class').match(/(top|bottom)-(left|right)/)[0]
            if (cards[arrow].length) {
                cards[arrow].unshift(cards[arrow].pop())
            }
            console.log('trying to rotate!!')
            $(`#${arrow}-card`).addClass('transitions').css('transform', 'rotate(90deg)')
            setTimeout(() => $('.card').removeClass('transitions'), 200)
            setTimeout(redrawGuess, 200)
        })
    }

    function submitClues() {
        let currClues = $('.clue-input').removeClass('error-input').toArray().map(v => $(v).val().trim())
        let cloverWords = [].concat(...Object.values(cards)).map(v => v.toLowerCase())
        let checks = [
            // empty clue check
            {
                check: () => currClues.reduce((a,b,i) => b ? a : [...a, i], []),
                message: 'You must fill in all the clues.'
            },
            // multiple word clue check
            {
                check: () => currClues.reduce((a,b,i) => b.match(/\s/) ? [...a, i] : a, []),
                message: 'You cannot have spaces in your clues.'
            },
            // illegal clue check (using a clover word)
            {
                check: () => currClues.reduce((a,b,i) => cloverWords.includes(b.toLowerCase()) ? [...a, i] : a, []),
                message: 'You cannot use one of the clover words.'
            },
            // duplicate clue check
            {
                check: () => currClues.reduce((a,b,i,v) => v.indexOf(b) !== v.lastIndexOf(b) ? [...a, i] : a, []),
                message: 'Your clues must all be unique.'
            },
        ]
        for (let check of checks) {
            err = check.check()
            if (err.length) {
                showAlert(check.message)
                err.forEach(n => $($('.clue-input').toArray()[n]).addClass('error-input'))
                return
            }
        }

        // submit clues
        answerKey = {
            clueKey: {
                'top': currClues[0],
                'bottom': currClues[1],
                'right': currClues[2],
                'left': currClues[3],
            },
            [currClues[0]]: [cards['top-left'][0], cards['top-right'][0]],
            [currClues[1]]: [cards['bottom-right'][2], cards['bottom-left'][2]],
            [currClues[2]]: [cards['top-right'][1], cards['bottom-right'][1]],
            [currClues[3]]: [cards['bottom-left'][3], cards['top-left'][3]],
        }
        socket.emit('submit-clues', answerKey)
    }

    function redrawClover() {
        $('.lower-container').html(makeCard(cards, clues))
        updateButtons(redrawClover)
        animateInputs()
    }

    function swapCards(cardA, cardB, cardAOffset = $(cardA).offset(), cardBOffset = $(cardB).offset()) {
        
        $(cardA).addClass('transitions').css({
            top: cardBOffset.top - cardAOffset.top,
            left: cardBOffset.left - cardAOffset.left,
        })
        $(cardB).draggable({
            revert: false
        }).addClass('transitions').css({
            top: cardAOffset.top - cardBOffset.top,
            left: cardAOffset.left - cardBOffset.left,
        })

        // swap cards in model
        let cardAName = $(cardA).attr('id')
        let cardBName = $(cardB).attr('id')
        console.log(cardAName, cardBName)
        if (cardAName.includes('unplaced') && cardBName.includes('unplaced')) {
            // swap 2 unplaced
            let idx1 = cardAName.slice(-1)
            let idx2 = cardBName.slice(-1)
            let temp = cards.unplaced[idx1]
            cards.unplaced[idx1] = cards.unplaced[idx2]
            cards.unplaced[idx2] = temp
        } else if (!cardAName.includes('unplaced') && !cardBName.includes('unplaced')) {
            // swap 2 placed
            let idx1 = cardAName.slice(0,-5)
            let idx2 = cardBName.slice(0,-5)
            let temp = cards[idx1]
            cards[idx1] = cards[idx2]
            cards[idx2] = temp
        } else {
            // swap 1 of each
            let idx1, idx2
            if (cardAName.includes('unplaced')) {
                idx1 = cardAName.slice(-1)
                idx2 = cardBName.slice(0,-5)
            } else {
                idx1 = cardBName.slice(-1)
                idx2 = cardAName.slice(0,-5)
            }
            let temp = cards.unplaced[idx1]
            cards.unplaced[idx1] = cards[idx2]
            cards[idx2] = temp
        }
        setTimeout(redrawGuess, 200)
    }

    function redrawGuess() {
        $('.lower-container').html(makeGuessCard(cards, clues))
        updateButtons(redrawGuess)
        updateCardArrows()
        $('.card').draggable({
            revert: true,
            revertDuration: 200,
            zIndex: 999
        }).droppable({
            drop: (event, ui) => {
                // let containerOffset         
                let dropped = event.target
                let dragged = ui.draggable[0]       
                let originalDragPosition = {
                    top: $(dragged).offset().top - ui.position.top,
                    left: $(dragged).offset().left - ui.position.left,
                }
                swapCards(dropped, dragged, $(dropped).offset(), originalDragPosition)
            }
        })

        $('.submit-guess').on('click', () => {
            let corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
            if (corners.every(v => cards[v].length)) {
                let sides = {
                    top: [cards['top-left'][0], cards['top-right'][0]],
                    right: [cards['top-right'][1], cards['bottom-right'][1]],
                    bottom: [cards['bottom-right'][2], cards['bottom-left'][2]],
                    left: [cards['bottom-left'][3], cards['top-left'][3]],
                }
                let correct = {
                    'top-left': guessData.answers[clues.top][0] === sides.top[0],
                    'top-right': guessData.answers[clues.top][1] === sides.top[1],
                    'bottom-left': guessData.answers[clues.bottom][1] === sides.bottom[1],
                    'bottom-right': guessData.answers[clues.bottom][0] === sides.bottom[0],
                }
                let blanks = $('.unplaced-cards > .blank-card').toArray()
                let idx = 0
                for (let [key, value] of Object.entries(correct)) {
                    if (!value) {
                        swapCards($(`#${key}-card`), $(blanks[idx++]))
                    }
                }
                if (Object.values(correct).every(v => v)) {
                    showAlert('Correct!!')
                    $('.submit-guess').html(isLastGuess ? 'New Round' : 'Next Clover').on('click', () => {
                        socket.emit(isLastGuess ? 'start-new-round' : 'get-next-clover')
                    })
                }
            } else {
                showAlert('The clover must be filled before you can guess.')
            }
        })
    }

    function redrawWaitingRoom([fin, unfin]) {
        const waitingString = (p, classes) => {
            return p.map(v => `<span class="${classes.join(' ')}">${v}</span>`).join('')
        }
        if ($('.waiting').length) {
            // just update list of people we're waiting on
            $('.waiting-on')
                .toArray()
                .filter(v => fin.includes($(v).html()))
                .forEach(v => $(v).addClass('not-waiting-on'))
        } else {
            // create everything
            $('.lower-container').html(() => {
                return `<div class="waiting">${waitingString(fin, ['not-waiting-on', 'waiting-on']) + waitingString(unfin, ['waiting-on'])}</div>
                <div class="loading-anim">
                    <div class="loading-bar" id="loading-bar-A"></div>
                    <div class="loading-bar" id="loading-bar-B"></div>
                    <div class="loading-bar" id="loading-bar-C"></div>
                    <div class="loading-bar" id="loading-bar-D"></div>
                    <div class="loading-bar" id="loading-bar-E"></div>
                </div>`
            })
            const anim = () => {
                $('#loading-bar-A').css('height', '2.5em')
                setTimeout(() => {
                    $('#loading-bar-B').css('height', '2.5em')
                }, 200)
                setTimeout(() => {
                    $('#loading-bar-A').css('height', '1.5em')
                    $('#loading-bar-C').css('height', '2.5em')
                }, 400)
                setTimeout(() => {
                    $('#loading-bar-B').css('height', '1.5em')
                    $('#loading-bar-D').css('height', '2.5em')
                }, 600)
                setTimeout(() => {
                    $('#loading-bar-C').css('height', '1.5em')
                    $('#loading-bar-E').css('height', '2.5em')
                }, 800)
                setTimeout(() => {
                    $('#loading-bar-D').css('height', '1.5em')
                }, 1000)
                setTimeout(() => {
                    $('#loading-bar-E').css('height', '1.5em')
                }, 1200)
            }
            anim()
            animInterval = setInterval(anim, 2000)
        }
    }

    function animateInputs() {
        $('.bottom-line > input').off().on('focus', function() {
            $(this).removeClass('error-input').parent().addClass('bottom-line-full')
        }).on('blur', function() {
            $(this).parent().removeClass('bottom-line-full')
        })
    }

    $('.join-game-button').on('click', () => {
        let name = $('.name-input').val().trim()
        if (!name) {
            showAlert('Name cannot be blank.')
        } else {
            socket.emit('name-selection', name)
        }
    })

    socket.on('showAlert', str => showAlert(str))

    socket.on('disconnected-users', userList => {
        if (userList.length) {
            $('.lower-container').append(`<div class="reconnect-buttons">
                <span class="small-title">Or reconnect as...</span>
                ${userList.map(v => `<button class="reconnect-as-button">${v}</button>`).join('')}
            </div>`)
            $('.reconnect-as-button').on('click', function() {
                socket.emit('reconnect-as', $(this).html())
            })
        }
    })

    socket.on('send-clover', clover => {
        guessData = undefined
        cards = clover
        redrawClover()
    })

    socket.on('unfinished-players', players => {
        redrawWaitingRoom(players)
    })

    socket.on('lets-make-guesses', ({ cloverData, isLast }) => {
        $('.title-append').html(`&nbsp;- ${cloverData.name}`)
        guessData = cloverData
        isLastGuess = isLast
        cards = {
            'top-left': [],
            'top-right': [],
            'bottom-left': [],
            'bottom-right': [],
            unplaced: []
        }
        for (let key of Object.keys(cards)) {
            if (key === 'unplaced') continue
            cards.unplaced.push(guessData.clover[key].words)
        }
        cards.unplaced.push(guessData.clover.extra.words)
        cards.unplaced = shuffle(cards.unplaced)
        clues = guessData.answers.clueKey
        redrawGuess()
    })

    socket.on('end-anim', () => animInterval.clearInterval ? animInterval.clearInterval() : null)

    animateInputs()
})