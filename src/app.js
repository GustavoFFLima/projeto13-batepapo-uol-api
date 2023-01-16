import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import joi from 'joi'
import dayjs from 'dayjs'

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
    console.log(dados.name)
    const validaUsuarioSchema = joi.object({
        name: joi.string().required()
    })

    const validandoUsuario = validaUsuarioSchema.validate(dados)
    if(validandoUsuario.error) {
        const erros = validandoUsuario.error.details.map((detail) => detail.message)
        return res.status(422).send(erros)
    }

     try {
        const usuario = await usuarios.findOne(dados)
        if(usuario) return res.sendStatus(409)

        await usuarios.insertOne({name:dados.name, lastStatus: Date.now() })
        const tempo = dayjs().format('HH:mm:ss')
        const mensagem = {from: dados.name, to:'Todos', text: 'entra na sala...', type: 'status', time: tempo}

        mensagens.insertOne({ ...mensagem })
        res.sendStatus(201)
    } catch (erro) {
        res.status(500).send(erro)
    }
})

app.get("/participants", async (req,res) => {
    try {
        const cadastrados = await usuarios.find({}).toArray()
        res.send(cadastrados)
    } catch (erro) {
        res.status(500).send(erro)
    }
})










    // const validadeMensagem = joi.object({
    //     to: joi.string().required(),
    //     text: joi.string().required(),
    //     type: joi.string().required().valid('mensagem')
    // })