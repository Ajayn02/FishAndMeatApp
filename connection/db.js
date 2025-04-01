const {PrismaClient}=require('@prisma/client')

const prisma=new PrismaClient()


prisma.$connect()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

module.exports = prisma;

