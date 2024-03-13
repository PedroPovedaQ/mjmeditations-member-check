const port = process.env.PORT || 3000;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;
const fastify = require('fastify')({
  logger: true
})
const { Client, Environment } = require('square');
const cors = require('fastify-cors');
fastify.register(cors);

const squareClient = new Client({
  accessToken: process.env.mj_sqp_token,
  environment: Environment.Production, // Change to Environment.Production for production
});


fastify.post('/check-subscription', async (request, reply) => {
  try {
    const { email } = request.body;

    // Search for customer by email
    const searchCustomersResponse = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email
          }
        }
      }
    });

    const customers = searchCustomersResponse.result.customers;

    // If no customer is found
    if (!customers || customers.length === 0) {
      return reply.send({ hasActiveSubscription: false, message: 'No customer found with this email.' });
    }

    // Assuming the first matching customer is the target customer
    const customerId = customers[0].id;

    // Fetch subscriptions for the customer
    const searchSubscriptionsResponse = await squareClient.subscriptionsApi.searchSubscriptions({
      query: {
        filter: {
          customerIds: [customerId],
          status: ['ACTIVE'],
        },
      },
    });

    const hasActiveSubscription = searchSubscriptionsResponse.result.subscriptions && searchSubscriptionsResponse.result.subscriptions.length > 0;

    // Respond based on the subscription status
    return reply.send({ hasActiveSubscription });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'An error occurred while checking the subscription status.' });
  }
});

fastify.listen({host: host, port: port }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
