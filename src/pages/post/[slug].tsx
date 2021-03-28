import { format } from 'date-fns';
import PrismicDOM from 'prismic-dom';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import CommentsField from '../../components/CommentsField';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface NextAndPrevPosts {
  uid: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  nextPost: NextAndPrevPosts;
  prevPost: NextAndPrevPosts;
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  const wordsInBodyContent = post?.data.content.reduce((acc, value) => {
    const body = PrismicDOM.RichText.asText(value.body).split(/\s/g);
    const heading = value.heading.split(/\s/g);

    return acc + (body.length + heading.length);
  }, 0);

  const readTiming = Math.ceil(wordsInBodyContent / 180);

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Loading | Ignite</title>
        </Head>
        <Header />

        <main className={commonStyles.container}>
          <article className={styles.articleContent}>
            <h1>Carregando...</h1>
          </article>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Ignite</title>
      </Head>

      <Header />

      <section className={styles.imageContainer}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </section>

      <main className={commonStyles.container}>
        <article className={styles.articleContent}>
          <h1>{post.data.title}</h1>

          <div className={commonStyles.postInfo}>
            <FiCalendar size={16} />
            <div>
              <span>
                {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>

            <FiUser size={16} />
            <div>
              <span>{post.data.author}</span>
            </div>

            <FiClock size={16} />
            <div>
              <span>{readTiming && `${readTiming} min`}</span>
            </div>
          </div>
          <div>
            <span className={styles.editedInfo}>
              *
              {format(
                new Date(post.last_publication_date),
                "'editado em' d MMM yyyy, 'às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            </span>
          </div>

          {post.data.content.map(content => {
            return (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: PrismicDOM.RichText.asHtml(content.body),
                  }}
                />
              </section>
            );
          })}
        </article>
        <hr className={styles.diviserContent} />
      </main>

      <footer className={styles.postsFooter}>
        <section className={styles.nextAndPrevPage}>
          {prevPost.data && (
            <Link href={`/post/${prevPost.uid}`}>
              <a>
                <h3>{prevPost.data.title}</h3>
                <span>Post Anterior</span>
              </a>
            </Link>
          )}

          {nextPost.data && (
            <Link href={`/post/${nextPost.uid}`}>
              <a className={styles.nextPage}>
                <h3>{nextPost.data.title}</h3>
                <span>Próximo Post</span>
              </a>
            </Link>
          )}
        </section>

        <CommentsField />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>
                <button type="button" className={commonStyles.previewMode}>
                  <span>Sair do modo Preview</span>
                </button>
              </a>
            </Link>
          </aside>
        )}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { page: 1, pageSize: 3 }
  );

  const pathsInAPI = posts.results.map(post => {
    const uidPost = post.uid;
    return {
      params: { slug: uidPost },
    };
  });

  return {
    paths: pathsInAPI,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  const { slug } = params;
  const { ref } = previewData;
  const prismic = getPrismicClient();

  let response;
  let nextPost;
  let prevPost;
  if (!ref) {
    response = await prismic.getByUID('posts', String(slug), {
      pageSize: 1,
      page: 1,
    });

    nextPost = await prismic.query(
      [
        Prismic.Predicates.at('document.type', 'posts'),
        Prismic.Predicates.dateAfter(
          'document.first_publication_date',
          response.first_publication_date
        ),
      ],
      { pageSize: 1 }
    );

    prevPost = await prismic.query(
      [
        Prismic.Predicates.at('document.type', 'posts'),
        Prismic.Predicates.dateBefore(
          'document.first_publication_date',
          response.first_publication_date
        ),
      ],
      { pageSize: 1 }
    );
  } else {
    response = await prismic.getSingle('posts', { ref });
  }

  // const dateFormatted = format(
  //   new Date(response.first_publication_date),
  //   'd MMM yyyy',
  //   {
  //     locale: ptBR,
  //   }
  // );

  // const contentConvertedHTML = response.data.content.map(content => {
  //   return {
  //     heading: content.heading,
  //     body: { text: content.body },
  //   };
  // });

  // const postHandled = {
  //   first_publication_date: response.first_publication_date,
  //   data: {
  //     title: response.data.title,
  //     banner: response.data.banner,
  //     author: response.data.author,
  //     content: response.data.content,
  //   },
  // };

  return {
    props: {
      post: response,
      preview,
      nextPost: nextPost?.results[0] ?? {},
      prevPost: prevPost?.results[0] ?? {},
    },
  };
};
