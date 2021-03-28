import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { format } from 'date-fns';

import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [postMainData, setPostMainData] = useState<Post[]>(
    postsPagination ? postsPagination.results : []
  );

  const [urlNextPagePosts, setUrlNextPagePosts] = useState<string>(
    postsPagination ? postsPagination.next_page : ''
  );

  async function handleMorePages(): Promise<void> {
    const { next_page, results }: PostPagination = await fetch(
      postsPagination.next_page
    ).then(info => info.json());

    const dataPosts = [...postMainData];

    /* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["result"] }] */
    const resultFormatted = results.map(result => {
      result.first_publication_date = format(
        new Date(result.first_publication_date),
        'd MMM yyyy',
        {
          locale: ptBR,
        }
      );

      return {
        ...result,
      };
    });

    dataPosts.push(...resultFormatted);
    setPostMainData(dataPosts);
    setUrlNextPagePosts(next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Ignite</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <section className={styles.postsContainer}>
          {postMainData.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>

                <div className={commonStyles.postInfo}>
                  <FiCalendar size={16} />
                  <div>
                    <span>
                      {format(
                        new Date(post.first_publication_date),
                        'd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                  </div>

                  <FiUser className={commonStyles.authorIcon} size={16} />
                  <div>
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
          {urlNextPagePosts && (
            <button type="button" onClick={handleMorePages}>
              <span>Carregar mais posts</span>
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      page: 1,
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    const { title, subtitle, author } = post.data;
    // const dateFormatted = format(
    //   new Date(post.first_publication_date),
    //   'd MMM yyyy',
    //   {
    //     locale: ptBR,
    //   }
    // );

    return {
      uid: String(post.uid),
      first_publication_date: post.first_publication_date,
      data: {
        title,
        subtitle,
        author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 30,
  };
};
