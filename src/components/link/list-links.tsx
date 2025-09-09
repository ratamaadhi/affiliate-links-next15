'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { useContext, useEffect } from 'react';

function ListLinks() {
  const linkPageState = useContext(LinkPageContext);

  useEffect(() => {
    console.log('linkPageState', linkPageState);
  }, [linkPageState]);
  return (
    <div>
      <span>List Links page {linkPageState.selectedPage.slug}</span>
    </div>
  );
}

export default ListLinks;
