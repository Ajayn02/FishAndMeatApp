require('dotenv').config()
const express = require('express')
const cors = require('cors')
require('./config/db')
const router = require('./routes/route')
const productRoutes = require('./routes/productRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const orderRoutes = require('./routes/orderRoutes')
const cartRoutes=require('./routes/cartRoutes')

const server = express()

server.use(cors())
server.use(express.json())
server.use(router)
server.use(productRoutes)
server.use(authRoutes)
server.use(userRoutes)
server.use(orderRoutes)
server.use(cartRoutes)



server.use('/uploads', express.static('./uploads'))


const PORT = 3000 || process.env.PORT
const HOST = "0.0.0.0"; // Allows connections from any network device

server.listen(PORT, HOST, () => {
    console.log(`server running at port ${PORT}`);
})

server.get("/", (req, res) => {
    res.send("<h1>server is live</h1>")
})
