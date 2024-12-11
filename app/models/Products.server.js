export async function getProducts(graphql) {
  const response = await graphql(
    `#graphql
          query {
            products(first: 20) {
              edges {
                node {
                  id
                  title
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        inventoryQuantity
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `
  );

  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(({ node }) => {

    const data = ({
      id: node.id,
      title: node.title,
      image: node.images.edges[0]?.node.url,
      price: `$${parseFloat(node.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
      quantity: node.variants.edges[0]?.node.inventoryQuantity || '0'
    })

    return data;
  })

  return {
    products,
    pageInfo: responseJson.data.products.pageInfo
  };
}

export async function getNextPageProducts(graphql, cursor) {
  const response = await graphql(
    `#graphql
      query getProducts($cursor: String!) {
        products(first: 20, after: $cursor) {
          edges {
            cursor
            node {
              id
              title
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    {
      variables: {
        cursor: cursor
      }
    }
  );

  const responseJson = await response.json();

  const products = responseJson.data.products.edges.map(({ node }) => {

    const data = ({
      id: node.id,
      title: node.title,
      image: node.images.edges[0]?.node.url,
      price: `$${parseFloat(node.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
      quantity: node.variants.edges[0]?.node.inventoryQuantity || '0'
    })

    return data;
  })

  return {
    products,
    pageInfo: responseJson.data.products.pageInfo
  };
}
