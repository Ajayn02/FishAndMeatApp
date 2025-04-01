require('dotenv').config()
const express=require('express')
const cors=require('cors')
require('./connection/db')
const router=require('./routes/route')

const server=express()

server.use(cors())
// Increase request body size limit
server.use(express.json({ limit: '50mb' }));  
server.use(express.urlencoded({ limit: '50mb', extended: true }));
server.use(router)
server.use('/uploads', express.static('./uploads'))


const PORT=3000 || process.env.PORT
const HOST = "0.0.0.0"; // Allows connections from any network device

server.listen(PORT,HOST,()=>{
    console.log(`server running at port ${PORT}`);
})

server.get("/",(req,res)=>{
    res.send("<h1>server is live</h1>")
})
