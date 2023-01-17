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

app.post("/messages", async (req, res) => {
    const dados = req.body
    const { user } = req.headers;
    const validaMensagemSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required().valid('message', "private_message")
    })

    const validandoMensagem = validaMensagemSchema.validate(dados)
    if(validandoMensagem.error) {
        const erros = validandoMensagem.error.details.map((detail) => detail.message)
        return res.status(422).send(erros)
    }

    try {
        const usuario = await usuarios.findOne({ name: user })
        console.log(usuario)
        if(!usuario) return res.sendStatus(422)

        const tempo = dayjs().format('HH:mm:ss')
        console.log(user)
        const mensagem = {from: user, to:dados.to, text: dados.text, type: dados.type, time: tempo}

        await mensagens.insertOne(mensagem)
        res.sendStatus(201)
    } catch (erro) {
        res.status(500).send(erro)
    }
})

app.get("/messages", async (req, res) => {
    try {
        const mensgensEnviadas = await mensagens.find({}).toArray() 
        
        if(req.query?.limit) {
            const limit = parseInt(req.query?.limit)
            if(typeof limit !== "number" || isNaN(limit)) {
                res.status(400).send("limit error")
            }
            return res.send(mensgensEnviadas.slice(-limit).reverse())
        }
        res.send(mensgensEnviadas.reverse())
    } catch (erro) {
        res.status(500).send(erro)
    }
})

app.post("/status", async (req, res) => {
    try {
        const usuariologado = req.header.user
        const usuario = await usuarios.findOne({ name: usuariologado })

        if(!usuario) return res.sendStatus(404)

        await usuarios.updateOne({ name: usuariologado }, {$set: {lastStatus:Date.now()}})
        res.sendStatus(200)
    } catch (erro) {
        res.status(500).send(erro)
    }
})

const usuarioInativos = async () => {
    const dataAtual = Date.now()
    const tempo = dayjs().format('HH:mm:ss')

    try {
        await (await mensagens.find({}).toArray()).map(async (detail) => {
            if(detail.lastStatus < dataAtual - 10000) {
                await usuarios.deleteOne(detail)
                await mensagens.insertOne({from: detail.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: tempo})
            }
        })     
    } catch (erro) {
        res.status(500).send(erro)
    }
}

setInterval(usuarioInativos, 15000)