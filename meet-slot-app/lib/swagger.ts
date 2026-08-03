import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Meet Slot API',
        version: '1.0.0',
        description: 'API для бронювання переговорних кімнат',
      },
      tags: [
        { name: 'Auth', description: 'Авторизація та сесії' },
        { name: 'Rooms', description: 'Операції з кімнатами' },
        { name: 'Bookings', description: 'Бронювання слотів' },
      ],
    },
  });
  return spec;
};
