import { PrismaClient } from '@prisma/client'
import fastify, { FastifyBaseLogger, FastifyInstance, FastifyPluginOptions, FastifyTypeProvider, RawServerDefault } from 'fastify'
import { IncomingMessage, ServerResponse } from 'http'
import {date, number, z} from 'zod'
const app = fastify()
const prisma = new PrismaClient()

app.get('/users',async () => {
    const users = await prisma.user.findMany();

    return {users};
})

app.get('/test', (request, reply) => {
    return reply.status(200).send({ message: 'Rota funcionando!' });
});
app.post('/users',async (request, reply) => {
    const createUserSchema = z.object({
        name: z.string(),
        email: z.string().email(),
    })

    const {name, email} =createUserSchema.parse(request.body);
    await prisma.user.create({
        data: {
            name,
            email,
        }
    });

    return reply.status(201).send();
});
app.post('/dataStatusUpload',async (request, reply) => {
    const dataUpload = z.object({
        temperatura: z.number().refine(value => Number.isFinite(value), {
            message: 'A temperatura deve ser um número válido.',
        }),
        pressao: z.number().refine(value => Number.isFinite(value), {
            message: 'A pressão deve ser um número válido.',
        }),
        SenTermica: z.number().refine(value => Number.isFinite(value), {
            message: 'A sensação térmica deve ser um número válido.',
        }),
        umidade: z.number().refine(value => Number.isFinite(value), {
            message: 'A umidade deve ser um número válido.',
        }),
        luminosidade: z.number().refine(value => Number.isFinite(value), {
            message: 'A luminosidade deve ser um número válido.',
        }),
        altitude: z.number().refine(value => Number.isFinite(value), {
            message: 'A altitude deve ser um número válido.',
        }),
    });
    try {
        const {temperatura, pressao,SenTermica,umidade,luminosidade,altitude} =dataUpload.parse(request.body);
        await prisma.statusStation.create({
            data: {
                temperatura,
                pressao,
                SenTermica,
                umidade,
                luminosidade,
                altitude
            }
        });
        return reply.status(201).send();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send({
                message: 'Erro na validação dos dados.',
                errors: error.errors?.map((err: { path: any[]; message: any }) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })) || [],  // Se error.errors não for um array, retorna um array vazio
            });
        }

        // Se o erro não for relacionado ao Zod, retornamos um erro genérico
        return reply.status(500).send({
            message: 'Erro inesperado.',
            error: error.message,
        });
    }
    
});

app.get('/dataStatusUpload',async () => {
    const dados = await prisma.statusStation.findMany({take:10});

    return {dados};
})



app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({ message: 'Rota não encontrada.' })
});
app.listen({
    host:'0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then(()=>{
    console.log('HTTP SERVER Runing')
})


