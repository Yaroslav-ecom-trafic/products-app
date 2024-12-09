import React, { useState } from 'react';
import { Page, Card, DataTable } from '@shopify/polaris';

const headings = [
  { title: 'Products' },
  { title: 'Price' },
  { title: 'SKU Number' },
  { title: 'Net quantity' },
  { title: 'Net sales' },
];

const products = [
  {
    id: 23423423888,
    name: "Emerald Silk Grown",
    price: "$875.00",
    sku: "23423423888",
    netQuantity: "140",
    netSeils: "$12,500.00"
  },
  {
    id: 23423423,
    name: "Mauve Silk Grown",
    price: "$240.00",
    sku: "23423423",
    netQuantity: "83",
    netSeils: "$19,090.00"
  },
  {
    id: 9786823423,
    name: "Navy Merino Wool Blazer with khaki chinos and yellow belt",
    price: "$445.00",
    sku: "9786823423",
    netQuantity: "32",
    netSeils: "$14,240.00"
  }
];

function totalNetQuantity(products) {
  return products.reduce((sum, product) => sum + Number(product.netQuantity), 0);
}

function totalNetSeils(products) {
  return products.reduce((sum, product) => sum + parseFloat(product.netSeils.replace(/[^0-9.-]+/g,"")), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesByProduct() {
  const [sortDirection, setSortDirection] = useState('none');
  const [sortedColumnIndex, setSortedColumnIndex] = useState(null);
  const [sortedRows, setSortedRows] = useState(products);

  const handleSort = (index, direction) => {
    const sorted = [...sortedRows].sort((a, b) => {
      const key = index === 1 ? 'price' : index === 3 ? 'netQuantity' : 'netSeils';
      const aValue = parseFloat(a[key].replace(/[^0-9.-]+/g,""));
      const bValue = parseFloat(b[key].replace(/[^0-9.-]+/g,""));
      return direction === 'ascending' ? aValue - bValue : bValue - aValue;
    });

    setSortedRows(sorted);
    setSortDirection(direction);
    setSortedColumnIndex(index);
  };

  const rows = sortedRows.map(product => [
    product.name,
    product.price,
    product.sku,
    product.netQuantity,
    product.netSeils,
  ]);

  return (
    <Page title="Sales by product">
      <Card>
        <DataTable
          columnContentTypes={[
            'text',
            'numeric',
            'numeric',
            'numeric',
            'numeric',
          ]}
          headings={headings.map((heading) => heading.title)}
          rows={rows}
          totals={['', '', '', totalNetQuantity(products), "$" + totalNetSeils(products)]}
          sortable={[false, false, false, false, true]}
          defaultSortDirection="descending"
          // initialSortColumnIndex={4}
          onSort={handleSort}
          sortDirection={sortDirection}
          sortedColumnIndex={sortedColumnIndex}
        />
      </Card>
    </Page>
  );
}