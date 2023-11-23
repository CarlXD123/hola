import React, { useState, useEffect } from 'react';
import { getAllOrders, getProductName } from '../api/api';
interface Sale {
    id: number;
    productName: string;
    name: string;
    direccion: string;
    telefono: string;
    price: number;
    date: string;
}

const Sales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);

    console.log(sales)
    useEffect(() => {
        getAllOrders()
            .then(async (orders) => {
                const salesData: Sale[] = await Promise.all(
                    orders.map(async (order: any) => {
                        return {
                            id: `${order.id_order}-${order.id_product}`,
                            productName: order.product_name,
                            name: order.customer_name,
                            direccion: order.customer_address,
                            telefono: order.customer_phone,
                            price: order.price_unit,
                            date: order.date_order,
                        };
                    })
                );
                setSales(salesData);
            })
            .catch((error) => {
                console.error('Error al obtener órdenes:', error);
            });
    }, []);

    console.log(sales)
    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6">Pedidos</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {sales.length === 0 ? (
                    <p className="text-gray-500">No se han registrado ventas aún.</p>
                ) : (
                    <table className="min-w-full bg-white border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Clientes</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Producto</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Direccion</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Telefono</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Precio (S/.)</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id}>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">{sale.name}</td>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">{sale.productName}</td>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">{sale.direccion}</td>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">{sale.telefono}</td>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">{sale.price}</td>
                                    <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-500">
                                        {new Date(sale.date).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Sales;
