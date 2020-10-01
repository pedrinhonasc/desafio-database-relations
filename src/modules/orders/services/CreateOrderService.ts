import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exist.');
    }

    const productsIds = products.map(product => {
      return { id: product.id };
    });

    const orderedProductsData = await this.productsRepository.findAllById(
      productsIds,
    );

    await this.productsRepository.updateQuantity(products);

    const productsToAdd = orderedProductsData.map(orderedProductData => {
      const productData = products.find(
        product => product.id === orderedProductData.id,
      );

      return {
        product_id: orderedProductData.id,
        price: orderedProductData.price,
        quantity: productData?.quantity || 0,
      };
    });

    const createdOrder = await this.ordersRepository.create({
      customer,
      products: productsToAdd,
    });

    return createdOrder;
  }
}

export default CreateOrderService;
