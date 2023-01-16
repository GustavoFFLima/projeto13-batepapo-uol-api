import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotnet from 'dotenv'
import dayjs from 'daysj'

const app = express()
const mongoClient = new MongoClient(process.env.DATABASE_URL)
const PORT = 5000
let db = mongoClient.db()
const usuarios = db.collection('participants')
const mensagens = db.collection('messages')

dotenv.config()
app.use(express.json())
app.use(cors())

app.listen(PORT, () => console.log(`Este servidor esta em execução na porta: ${PORT}`))

try {
    await mongoClient.connect()
} catch (erro) {
    console.log(erro)
} 

app.post("/participants", (req,res) => {
    const dados = req.body
    console.log(dados)
    res.send('ok')
    try {
        const usuario = await usuarios.findOne({dados})
        const time = dayjs().format('HH:mm:ss')
        const mensagem = {from: dados, to:'Todos', text: 'entra na sala...', type: 'status', time}

        if(usuario) return res.sendStatus(400)
        await usuarios.insertOne({dados, lastStatus: Date.now() })
        mensagens.insertOne({ ...mensagem })
        res.sendStatus(200)
    } catch (erro) {
        res.status(500).send(erro)
    }
})