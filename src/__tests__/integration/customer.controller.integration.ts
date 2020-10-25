import {expect} from '@loopback/testlab';
import {MemoryDataSource, PostgresqlDataSource} from '../../datasources';
import {Customer} from '../../models';
import {CustomerRepository} from '../../repositories';

describe('Customer (Integration)', () => {
  let repo: CustomerRepository;
  let customers: Customer[];
  const customersData = [
    {tenant: 'X', name: 'Fred Flintstone', address: 'No. 2, Town of Bedrock'},
    {tenant: 'X', name: 'Barney Rubble', address: 'No. 4, Town of Bedrock'},
    {tenant: 'Y', name: 'Top Cat', address: 'Trash can'},
  ];

  before(() => {
    repo = new CustomerRepository(
      process.env.USE_POSTGRESQL
        ? new PostgresqlDataSource()
        : new MemoryDataSource(),
    );
  });

  beforeEach(async () => {
    await repo.deleteAll();
    customers = await repo.createAll(customersData);
  });

  it('retrieves all customers', async () => {
    expect(await repo.find()).to.containDeep(customers);
  });

  it("retrieves just X's customers", async () => {
    expect(await repo.find({where: {tenant: 'X'}})).to.containDeep(
      customers.filter(c => c.tenant === 'X'),
    );
  });

  it("should not retrieve 'Top Cat' (simple OR)", async () => {
    expect(
      await repo.find({
        where: {
          or: [{name: 'Top Cat'}],
          tenant: 'X',
        },
      }),
    ).to.eql([]);
  });

  it("should not retrieve 'Top Cat' (compound OR) - this FAILS for Postgres!!!", async () => {
    expect(
      await repo.find({
        where: {
          or: [{name: 'Top Cat'}, {address: 'Trash can'}],
          tenant: 'X',
        },
      }),
    ).to.eql([]);
  });

  it("should not retrieve 'Top Cat' (Force correct behaviour in Postgres)", async () => {
    expect(
      await repo.find({
        where: {
          and: [
            {or: [{name: 'Top Cat'}, {address: 'Trash can'}]},
            {tenant: 'X'},
          ],
        },
      }),
    ).to.eql([]);
  });
});
