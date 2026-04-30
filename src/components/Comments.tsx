import React, {useEffect, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function useHtmlColorMode(): 'light' | 'dark' {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setMode(el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);

  return mode;
}

function GiscusComments(): JSX.Element {
  const colorMode = useHtmlColorMode();
  const Giscus = require('@giscus/react').default;

  return (
    <div style={{marginTop: '2rem'}}>
      <Giscus
        repo="braincrew-lab/brain-cache"
        repoId="R_kgDORwNP_Q"
        category="General"
        categoryId="DIC_kwDORwNP_c4C7CcZ"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        lang="ko"
      />
    </div>
  );
}

export default function Comments(): JSX.Element {
  return <BrowserOnly>{() => <GiscusComments />}</BrowserOnly>;
}
