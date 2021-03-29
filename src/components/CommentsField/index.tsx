import { useEffect } from 'react';

interface CommentsFieldProps {
  slug: string;
}

export default function CommentsField({
  slug,
}: CommentsFieldProps): JSX.Element {
  useEffect(() => {
    if (document.getElementById('comments-utterance').getAttribute('created')) {
      document
        .getElementById('comments-utterance')
        .childNodes.forEach(child => child.remove());
    }

    const script = document.createElement('script');
    const anchor = document.getElementById('comments-utterance');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', 'Vitor-Franco/utteranc-comments-field');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.setAttribute('created', 'true');
    anchor.appendChild(script);
  }, [slug]);

  return <div id="comments-utterance" />;
}
