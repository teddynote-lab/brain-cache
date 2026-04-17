import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function Comments(): JSX.Element {
  return (
    <BrowserOnly>
      {() => {
        const Giscus = require('@giscus/react').default;
        const {useColorMode} = require('@docusaurus/theme-common');
        const {colorMode} = useColorMode();

        return (
          <div style={{marginTop: '2rem'}}>
            <Giscus
              repo="teddynote-lab/brain-cache"
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
      }}
    </BrowserOnly>
  );
}
