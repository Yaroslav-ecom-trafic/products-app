import React, { useEffect, useState } from 'react';
import { Page, DataTable, Thumbnail } from '@shopify/polaris';
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { getNextPageProducts, getProducts } from '../models/Products.server';

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

export async function action({ request }) {
  const admin = await authenticate.admin(request);

  const formData = await request.formData();
  const cursor = formData.get('cursor');


  let products;

  console.log('cursor ====>>>>>', cursor);

  if (cursor === 'false') {
    console.log('cursor === false');
    products = await getProducts(admin.admin.graphql);
  }
  
  if (cursor !== 'false') {
    console.log('cursor !== false');
    
    products = await getNextPageProducts(admin.admin.graphql, cursor);
  }

  // console.log('products ====>>>>>', products);

  return json({
    products
  });
}

export default function SalesByProduct() {
  const fetcher = useFetcher();
  const { products: { products, pageInfo } } = useLoaderData();

  const [currentPage, setCurrentPage] = useState(0);

  const [sortDirection, setSortDirection] = useState('none');
  const [sortedColumnIndex, setSortedColumnIndex] = useState(null);
  const [sortedRows, setSortedRows] = useState(products);
  const [hasMore, setHasMore] = useState(pageInfo.hasNextPage || false);
  const [endCursor, setEndCursor] = useState(pageInfo.endCursor || null);
  const [cursorHistory, setCursorHistory] = useState([]);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    };

    if (fetcher.state === 'idle' && cursorHistory.length > 0) {
      const previousCursor = cursorHistory[cursorHistory.length - 2];

      setCursorHistory(prev => prev.slice(0, -1));

      fetcher.submit(
        { cursor: previousCursor || false },
        { method: "POST" }
      );
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);

    if (fetcher.state === 'idle') {
      setCursorHistory(prev => [...prev, endCursor]);

      fetcher.submit(
        { cursor: endCursor },
        { method: "POST" }
      );
    }
  };

  const handleSort = (index, direction) => {
    const sorted = [...sortedRows].sort((a, b) => {
      const key = headings[index].title.toLowerCase();
      
      switch (key) {
        case 'price':
          return direction === 'ascending' ? parseFloat(a[key].replace('$', '')) - parseFloat(b[key].replace('$', '')) : parseFloat(b[key].replace('$', '')) - parseFloat(a[key].replace('$', ''));
        case 'quantity':
          return direction === 'ascending' ? parseInt(a[key], 10) - parseInt(b[key], 10) : parseInt(b[key], 10) - parseInt(a[key], 10);
        case 'title':
          return direction === 'ascending' ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
      }

      return sorted;
    });

    setSortedRows(sorted);
    setSortDirection(direction);
    setSortedColumnIndex(index);
  };


  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {

      setSortedRows([...fetcher.data.products.products]);
      setHasMore(fetcher.data.products.pageInfo.hasNextPage);
      setEndCursor(fetcher.data.products.pageInfo.endCursor);
    }
  }, [fetcher.data, fetcher.state]);

  const rows = sortedRows.map(product => [
    product.title,
    <Thumbnail
      source={product.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png"}
      key={product.id}
      alt={product.title}
      size="small"
    />,
    product.price,
    product.quantity
  ]);

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
        sortable={[true, false, true, true]}
        defaultSortDirection="descending"
        onSort={handleSort}
        initialSortColumnIndex={3}
        sortDirection={sortDirection}
        sortedColumnIndex={sortedColumnIndex}
        pagination={{
          hasNext: hasMore,
          onNext: handleNextPage,
          hasPrevious: currentPage <= 0 ? false : true,
          onPrevious: handlePreviousPage,
          nextTooltip: fetcher.state !== 'idle' ? 'Loading...' : undefined,
          disabled: fetcher.state !== 'idle'
        }}
      />
    </Page>
  );
}