const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tunisia Student Housing API',
      version: '1.0.0',
      description: 'API documentation for Tunisia Student Housing platform',
      contact: {
        name: 'API Support',
        email: 'support@tunisiahousing.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            role: { type: 'string', enum: ['student', 'owner'] },
            name: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        Listing: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            propertyType: { type: 'string', enum: ['apartment', 'house', 'room'] },
            state: { type: 'string' },
            city: { type: 'string' },
            price: { type: 'number' },
            bedrooms: { type: 'number' },
            bathrooms: { type: 'number' },
            amenities: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } }
          }
        },
        Partner: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['binome', 'trinome', 'quadrinome'] },
            state: { type: 'string' },
            university: { type: 'string' },
            description: { type: 'string' },
            preferences: {
              type: 'object',
              properties: {
                gender: { type: 'string', enum: ['male', 'female', 'any'] },
                priceRange: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' }
                  }
                },
                studyField: { type: 'string' }
              }
            }
          }
        },
        HousingShare: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            governorate: { type: 'string' },
            city: { type: 'string' },
            address: { type: 'string' },
            university: { type: 'string' },
            currentOccupants: { type: 'integer' },
            totalCapacity: { type: 'integer' },
            pricePerPerson: { type: 'number' },
            preferences: {
              type: 'object',
              properties: {
                gender: { type: 'string', enum: ['male', 'female', 'any'] },
                studyField: { type: 'string' },
                yearOfStudy: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);