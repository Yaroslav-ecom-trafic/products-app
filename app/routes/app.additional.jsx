import React, { useEffect, useState } from 'react';
import { Page, DataTable, Thumbnail } from '@shopify/polaris';
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
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

  const products = await getNextPageProducts(admin.admin.graphql, cursor);

  // console.log('products ====>>>>>', products);

  return json({
    products
  });
}

export default function SalesByProduct() {
  const fetcher = useFetcher();
  const { products: { products, pageInfo } } = useLoaderData();
  // const actionData = useActionData();

  // const [currentPage, setCurrentPage] = useState(0);
  // const [allPages, setAllPages] = useState([products]);

  const [sortDirection, setSortDirection] = useState('none');
  const [sortedColumnIndex, setSortedColumnIndex] = useState(null);
  const [sortedRows, setSortedRows] = useState(products);
  const [hasMore, setHasMore] = useState(pageInfo.hasNextPage || false);
  const [endCursor, setEndCursor] = useState(pageInfo.endCursor || null);

  const handleNextPage = async () => {
    //  фетчер тригер для экшена когда нет форм.
    fetcher.submit(
      { cursor: endCursor },
      { method: "POST" }
    );
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

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      console.log('fetcher.data ====>>>>>', fetcher.data);

      setSortedRows([...fetcher.data.products.products]);
      setHasMore(fetcher.data.products.pageInfo.hasNextPage);
      setEndCursor(fetcher.data.products.pageInfo.endCursor);
    }
  }, [fetcher.data, fetcher.state]);

  const handlePreviousPage = () => {
    console.log('handlePreviousPage ====>>>>>');
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
          hasPrevious: true,
          onPrevious: handlePreviousPage,
          // Добавляем disabled состояние для кнопки
          nextTooltip: fetcher.state !== 'idle' ? 'Loading...' : undefined,
          disabled: fetcher.state !== 'idle'
        }}
      />
    </Page>
  );
}