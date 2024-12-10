import React, { useState } from 'react';
import { Page, DataTable, Thumbnail } from '@shopify/polaris';
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getProducts } from '../models/Products.server';

const headings = [
  { title: 'Title' },
  { title: 'Image' },
  { title: 'Price' },
  { title: 'Quantity' },
];

export async function loader({ request }) {
  const admin = await authenticate.admin(request);

  const products = await getProducts(admin.admin.graphql);

  return json({
    products
  });
}

export default function SalesByProduct() {
  const { products: { products, pageInfo } } = useLoaderData();

  const [sortDirection, setSortDirection] = useState('none');
  const [sortedColumnIndex, setSortedColumnIndex] = useState(null);
  const [sortedRows, setSortedRows] = useState(products);
  const [hasMore, setHasMore] = useState(pageInfo.hasNextPage || false);
  const [endCursor, setEndCursor] = useState(pageInfo.endCursor || null);

  console.log('hasMore ====>>>>>', hasMore);
  console.log('endCursor ====>>>>>', endCursor);

  const handleNextPage = async () => {
    console.log('handleNextPage ====>>>>>');

    // const nextProducts = await getNextPageProducts(admin.admin.graphql, endCursor);
    // setSortedRows([...nextProducts]);
    // setHasMore(nextProducts[0].pageInfo.hasNextPage);
    // setEndCursor(nextProducts[0].pageInfo.endCursor);
  };

  const handleSort = (index, direction) => {
    const sorted = [...sortedRows].sort((a, b) => {
      const key = headings[index].title.toLowerCase();

      const aValue = key === 'price'
        ? parseFloat(a[key].replace('$', ''))
        : parseInt(a[key], 10);
      const bValue = key === 'price'
        ? parseFloat(b[key].replace('$', ''))
        : parseInt(b[key], 10);

      return direction === 'ascending' ? aValue - bValue : bValue - aValue;
    });

    setSortedRows(sorted);
    setSortDirection(direction);
    setSortedColumnIndex(index);
  };

  const rows = sortedRows.map(product => [
    product.name,
    <Thumbnail
      source={product.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png"}
      key={product.id}
      alt={product.name}
      size="small"
    />,
    product.price,
    product.quantity
  ]);

  console.log('Current sortedRows:', sortedRows);

  return (
    <Page title="Sales by product">
      <DataTable
        columnContentTypes={[
          'text',
          'text',
          'numeric',
          'numeric',
        ]}
        headings={headings.map((heading) => heading.title)}
        rows={rows}
        sortable={[false, false, true, true]}
        defaultSortDirection="descending"
        onSort={handleSort}
        initialSortColumnIndex={3}
        sortDirection={sortDirection}
        sortedColumnIndex={sortedColumnIndex}
        pagination={{
          hasNext: hasMore,
          onNext: handleNextPage,
        }}
      />
    </Page>
  );
}