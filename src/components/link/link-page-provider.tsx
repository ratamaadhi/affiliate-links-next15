'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
} from '@/context/link-page-context';
import { useReducer } from 'react';

const initialLinkPageState = {
  selectedPage: '',
  keywordLink: '',
};

function linkPageReducer(state, action) {
  switch (action.type) {
    case 'changed': {
      return {
        ...state,
        selectedPage: action.payload,
      };
    }
    case 'search-link': {
      return {
        ...state,
        keywordLink: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}

function LinkPageProvider({ children }) {
  const [linkPageState, dispatch] = useReducer(
    linkPageReducer,
    initialLinkPageState
  );

  return (
    <LinkPageContext value={linkPageState}>
      <LinkPageDispatchContext value={dispatch}>
        {children}
      </LinkPageDispatchContext>
    </LinkPageContext>
  );
}

export default LinkPageProvider;
