import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const foundProduct = await this.ormRepository.findOne({
      where: { name },
    });

    return foundProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const foundProducts = await this.ormRepository.findByIds(products);

    if (products.length !== foundProducts.length) {
      throw new AppError('Missing product');
    }

    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = products.map(product => {
      return { id: product.id };
    });

    const productsToUpdate = await this.findAllById(ids);

    const updatedProducts = productsToUpdate.map(productToUpdate => {
      const foundProduct = products.find(
        product => product.id === productToUpdate.id,
      );

      if (!foundProduct) {
        throw new AppError(
          'Cannot update product quantity. Product not found.',
        );
      }

      if (foundProduct.quantity > productToUpdate.quantity) {
        throw new AppError('Insuficient product quantity');
      }

      const newProduct = productToUpdate;

      newProduct.quantity -= foundProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
