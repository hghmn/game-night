import { h, app } from 'https://unpkg.com/hyperapp@2.0.4/src/index.js?module'
import htm from 'https://unpkg.com/htm@3.0.3/dist/htm.module.js?module'
const html = htm.bind(h)

const pickCard = (categories, id) => {
    let cat = categories.find(c => c.id === id)
    let r = Math.floor(Math.random() * cat.questions.length)
    return cat.questions[r]
}

const SetState = (state, { key, value }) => ({ ...state, [key]: value })
const SelectCategory = (state, { id, name }) => ({
    ...state,
    categoryId: id,
    categoryName: name,
})
const ClearCategory = (state) => ({
    ...state,
    categoryId: null,
    categoryName: null,
    card: null,
    show: false,
})

const ShowCard = (state) => {
    let { card, show } = state;

    if (!card) {
        card = pickCard(state.categories, state.categoryId)
        show = true;
    } else {
        show = !show;
    }

    return {
        ...state,
        card,
        show,
    }
}

const NextCard = (state) => ({
    ...state,
    card: pickCard(state.categories, state.categoryId)
})

const CategoryList = ({ categories = [] }) => {
    let items = []
    for (let c of categories) {
        items.push(html`<div onClick=${[SelectCategory, c]} class="list-button">${c.name}</div>`)
    }

    return html`
        <div>
            <h1 class="heading">Charades!</h1>

            <h2>Select Category:</h2>
            ${items}
        </div>
    `
}

const WordCard = (state) => html`
<div>
    <a onClick=${ClearCategory}>← Back to Category List</a>
    <h2>Category: ${state.categoryName}</h2>

    <div class=${'card ' + (state.show ? '' : 'hide')}>
        <span class="card-text">${state.card}</span>
    </div>

    <div class="button-group">
        <button class="button skip" onClick="${ShowCard}">${state.show ? 'Hide Card' : 'Show Card'}</button>
        <button class="button next" onClick="${NextCard}">Next Card</button>
    </div>

</div>
`

const View = (state) => html`
<section class="container" key="game">
    ${state.categoryId ? WordCard(state) : CategoryList(state) }
</section>
`

const PreloadData = async (dispatch) => {
    let resp = await fetch('/charades/categories.json')
    let categories = await resp.json()

    dispatch(SetState, { key: 'categories', value: categories })
}

const initState = {
    // category: null,
}

const Speak = (_, { text }) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}
const speak = text => [Speak, { text }]

const SayCard = (state) => [state, speak(state.card)]

const KeypressListener = (dispatch, { events }) => {
    const handler = e => {
        if (e.code in events) {
            const action = events[e.code]
            dispatch(action, e)
        }
    }

    document.addEventListener('keypress', handler, false)
    return () => {
        document.removeEventListener('keypress', handler)
    }
}
const keypressListener = (props) => [KeypressListener, props]

app({
    node: document.getElementById('app'),
    init: [
        initState,
        [PreloadData],
    ],
    view: View,
    subscriptions: state => [
        keypressListener({
            events: {
                'Space': SayCard,
                'Enter': NextCard,
            }
        }),
    ]
})
