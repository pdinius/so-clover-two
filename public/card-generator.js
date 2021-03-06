function makeCard(cards, clues) {
    return `<div class="game-area">
        <div class="left-spacer"></div>
        <div class="clover-container transitions">
            <div class="bottom-line">
                <input class="clue-input top-input" type="text" value="${clues.top}" placeholder="enter a clue"/>
            </div>
            <div class="clover">
                <div class="card">
                    <div class="word">${cards['top-left'][0]}</div>
                    <div class="word flip">${cards['top-left'][2]}</div>
                    <div class="left-right-card">
                        <div class="word">${cards['top-left'][1]}</div>
                        <div class="word flip">${cards['top-left'][3]}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="word">${cards['top-right'][0]}</div>
                    <div class="word flip">${cards['top-right'][2]}</div>
                    <div class="left-right-card">
                        <div class="word">${cards['top-right'][1]}</div>
                        <div class="word flip">${cards['top-right'][3]}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="word">${cards['bottom-left'][0]}</div>
                    <div class="word flip">${cards['bottom-left'][2]}</div>
                    <div class="left-right-card">
                        <div class="word">${cards['bottom-left'][1]}</div>
                        <div class="word flip">${cards['bottom-left'][3]}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="word">${cards['bottom-right'][0]}</div>
                    <div class="word flip">${cards['bottom-right'][2]}</div>
                    <div class="left-right-card">
                        <div class="word">${cards['bottom-right'][1]}</div>
                        <div class="word flip">${cards['bottom-right'][3]}</div>
                    </div>
                </div>
            </div>
            <div class="bottom-line flip">
                <input class="clue-input bottom-input" type="text" value="${clues.bottom}" placeholder="enter a clue" />
            </div>
            <div class="left-right-inputs">
                <div class="bottom-line">
                    <input class="clue-input right-input" type="text" value="${clues.right}" placeholder="enter a clue" />
                </div>
                <div class="bottom-line flip">
                    <input class="clue-input left-input" type="text" value="${clues.left}" placeholder="enter a clue" />
                </div>
            </div>
        </div>
        <div class="right-spacer">
            <div class="right-controls">
                ${svgString('rotate', 3, ['card-rotate-button'])}
                <button class="submit-clues">Submit Clues!</button>
            </div>
        </div>
    </div>`
}

function makeGuessCard(cards, clues) {
    const makeString = (words, id) => {
        return words.length ? `<div class="card"${id ? ` id="${id}"` : ''}>
        <div class="word">${words[0]}</div>
        <div class="word flip">${words[2]}</div>
        <div class="left-right-card">
            <div class="word">${words[1]}</div>
            <div class="word flip">${words[3]}</div>
        </div>
    </div>` : `<div class="card blank-card"${id ? ` id="${id}"` : ''}></div>`
    }
    let cardStrings = {
        'top-left': makeString(cards['top-left'], 'top-left-card'),
        'top-right': makeString(cards['top-right'], 'top-right-card'),
        'bottom-left': makeString(cards['bottom-left'], 'bottom-left-card'),
        'bottom-right': makeString(cards['bottom-right'], 'bottom-right-card'),
        'unplaced': cards.unplaced.map((v,i) => makeString(v, `unplaced-card-${i}`)).join('')
    }
    return `<div class="game-area">
        <div class="left-spacer"></div>
        <div class="clover-container transitions">
            ${svgString('corner', 3, ['corner-arrow', 'top-left-arrow'])}
            ${svgString('corner', 3, ['corner-arrow', 'top-right-arrow'])}
            ${svgString('corner', 3, ['corner-arrow', 'bottom-left-arrow'])}
            ${svgString('corner', 3, ['corner-arrow', 'bottom-right-arrow'])}
            <span class="clover-clue">${clues.top}</span>
            <div class="clover">
                ${cardStrings['top-left']}
                ${cardStrings['top-right']}
                ${cardStrings['bottom-left']}
                ${cardStrings['bottom-right']}
            </div>
            <span class="flip clover-clue">${clues.bottom}</span>
            <div class="left-right-inputs">
                <span class="clover-clue">${clues.right}</span>
                <span class="flip clover-clue">${clues.left}</span>
            </div>
        </div>
        <div class="right-spacer">
            <div class="right-controls">
                ${svgString('rotate', 3, ['card-rotate-button'])}
                <button class="submit-guess">Guess</button>
            </div>
        </div>
    </div>
    <div class="unplaced-cards">${cardStrings.unplaced}</div>`
}