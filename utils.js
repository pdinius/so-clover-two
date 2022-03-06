module.exports = {
    getSetOfCards: (list, banned) => {
        if (banned.length > list.length - 4)
            throw new Error('Not enough card left to create a new set.')

        let res = []
        let n
        for (let i = 0; i < 4; ++i) {
            do {
                n = Math.floor(Math.random() * list.length)
            } while (banned.includes(n))
            res.push({
                card: list[n],
                offset: Math.floor(Math.random() * 4)
            })
        }
        console.log(res)
        return res
    }
}