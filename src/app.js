import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

const app = express()
dotenv.config()
app.use(express.json())
app.use(cors())

const mongoClient = new MongoClient(process.env.DATABASE_URL)
const PORT = 5000
let db;

app.listen(PORT, () => console.log(`Este servidor esta em execução na porta: ${PORT}`))

try {
    await mongoClient.connect()
} catch (erro) {
    console.log(erro)
} 

db = mongoClient.db();

const usuarios = db.collection('participants')
const mensagens = db.collection('messages')

app.post("/participants", async (req,res) => {
    const dados = req.body
    console.log(dados)
    res.send('ok')
    try {
        const usuario = await db.collection(usuarios).findOne({dados})
        const mensagem = {from: dados, to:'Todos', text: 'entra na sala...', type: 'status', time}

        if(usuario) return res.sendStatus(422)
        await db.collection(usuarios).insertOne({dados, lastStatus: Date.now() })
        mensagens.insertOne({ ...mensagem })
        res.sendStatus(201)
    } catch (erro) {
        res.status(500).send(erro)
    }
})