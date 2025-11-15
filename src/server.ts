import express from "express"
import dotenv from 'dotenv';
import cors from "cors"
import router from './routes/index'
dotenv.config();
const app = express()
const PORT = process.env.PORT || 5000

// Настройка CORS
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:4200', 
    'https://yuri3k.github.io',
    'https://yuri3k.github.io/freshok-frontend/home']
}))

// Middleware для парсинга тела запроса (JSON и URL-encoded)
app.use(express.json({ limit: '60mb' })); // Для JSON
app.use(express.urlencoded({ limit: '60mb', extended: true })); // Для форм

// Регистрация всех API маршрутов
app.use('/api', router) // Один вызов для всех роутов, собранных в routes/index

app.listen(PORT, () => {
  console.log('Server is run on port http://localhost:' + PORT)
})