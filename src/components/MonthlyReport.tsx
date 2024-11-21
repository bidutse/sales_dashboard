import React, { useState } from 'react';
import { Seller, Order, MonthlyStats, SellerStats } from '../types';
import MonthlyTable from './MonthlyTable';
import MonthlyCharts from './MonthlyCharts';

interface Props {
  sellers: Seller[];
  orders: Order[];
}

export default function MonthlyReport({ sellers, orders }: Props) {
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table');

  const calculateMonthlyStats = (): MonthlyStats[] => {
    const monthlyData: { [key: string]: MonthlyStats } = {};

    orders.forEach((order) => {
      const monthKey = order.month;
      const seller = sellers.find((s) => s.id === order.sellerId);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalOrders: 0,
          totalSellers: 0,
          totalOrderAmount: 0,
          totalVolumeAmount: 0,
          totalAmount: 0,
          totalVolume: 0
        };
      }

      const totalQuantity = order.quantityUnderThree + order.quantityOverThree;
      monthlyData[monthKey].totalOrders += totalQuantity;
      monthlyData[monthKey].totalVolume += order.volume;
      
      if (seller) {
        // Calculate volume-based revenue
        const volumeCharge = order.volume * seller.ratePerCubicMeter;
        monthlyData[monthKey].totalVolumeAmount += volumeCharge;

        // Calculate order-based revenue
        const underThreeCharge = order.quantityUnderThree * seller.rateUnderThree;
        const overThreeCharge = order.quantityOverThree * seller.rateOverThree;
        monthlyData[monthKey].totalOrderAmount += underThreeCharge + overThreeCharge;

        // Calculate total revenue
        monthlyData[monthKey].totalAmount += volumeCharge + underThreeCharge + overThreeCharge;
      }
    });

    sellers.forEach((seller) => {
      Object.keys(monthlyData).forEach((monthKey) => {
        const hasOrdersInMonth = orders.some(
          (order) => order.sellerId === seller.id && order.month === monthKey
        );
        if (hasOrdersInMonth) {
          monthlyData[monthKey].totalSellers += 1;
        }
      });
    });

    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
  };

  const calculateSellerStats = (): SellerStats[] => {
    const sellerData: { [key: string]: number } = {};
    let totalAmount = 0;

    orders.forEach((order) => {
      const seller = sellers.find((s) => s.id === order.sellerId);
      if (seller) {
        const volumeCharge = order.volume * seller.ratePerCubicMeter;
        const underThreeCharge = order.quantityUnderThree * seller.rateUnderThree;
        const overThreeCharge = order.quantityOverThree * seller.rateOverThree;
        
        const amount = volumeCharge + underThreeCharge + overThreeCharge;
        sellerData[seller.id] = (sellerData[seller.id] || 0) + amount;
        totalAmount += amount;
      }
    });

    return Object.entries(sellerData).map(([sellerId, amount]) => ({
      sellerId,
      sellerName: sellers.find(s => s.id === sellerId)?.name || 'Unknown',
      totalAmount: amount,
      percentage: (amount / totalAmount) * 100
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const monthlyStats = calculateMonthlyStats();
  const sellerStats = calculateSellerStats();

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'table' | 'charts')}
          >
            <option value="table">Table View</option>
            <option value="charts">Charts View</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('table')}
              className={`${
                activeTab === 'table'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              } px-3 py-2 font-medium text-sm rounded-md`}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`${
                activeTab === 'charts'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              } px-3 py-2 font-medium text-sm rounded-md`}
            >
              Charts View
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'table' ? (
        <MonthlyTable monthlyStats={monthlyStats} />
      ) : (
        <MonthlyCharts monthlyStats={monthlyStats} sellerStats={sellerStats} />
      )}
    </div>
  );
}