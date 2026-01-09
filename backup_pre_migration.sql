--
-- PostgreSQL database dump
--

\restrict AjKGqOnPA4N9rKH1Qt93ep7bQbjvBySA2tBPcOMVdWHKMAWrgEPo3CfmyifFPFX

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    endereco text,
    whatsapp character varying(20) NOT NULL,
    dia_vencimento integer DEFAULT 10 NOT NULL,
    valor_padrao numeric(10,2) DEFAULT 0.00 NOT NULL,
    professor_id integer,
    curso_id integer,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valor_professor numeric(10,2),
    valor_igreja numeric(10,2)
);


ALTER TABLE public.clientes OWNER TO cobranca_user;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clientes_id_seq OWNER TO cobranca_user;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.cursos (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    mensalidade_padrao numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true
);


ALTER TABLE public.cursos OWNER TO cobranca_user;

--
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.cursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cursos_id_seq OWNER TO cobranca_user;

--
-- Name: cursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.cursos_id_seq OWNED BY public.cursos.id;


--
-- Name: matriculas; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.matriculas (
    id integer NOT NULL,
    cliente_id integer,
    curso_id integer,
    professor_id integer,
    dia_vencimento integer DEFAULT 10,
    valor_mensalidade numeric(10,2) DEFAULT 0.00 NOT NULL,
    valor_professor numeric(10,2),
    valor_igreja numeric(10,2),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.matriculas OWNER TO cobranca_user;

--
-- Name: matriculas_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.matriculas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.matriculas_id_seq OWNER TO cobranca_user;

--
-- Name: matriculas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.matriculas_id_seq OWNED BY public.matriculas.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    cliente_id integer,
    mes_ref character varying(7) NOT NULL,
    valor_cobrado numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    status character varying(20) DEFAULT 'PENDENTE'::character varying,
    data_pagamento date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valor_professor_recebido numeric(10,2),
    valor_igreja_recebido numeric(10,2),
    msg_lembrete_enviada boolean DEFAULT false,
    msg_vencimento_enviada boolean DEFAULT false,
    msg_atraso_enviada boolean DEFAULT false,
    matricula_id integer,
    professor_id integer,
    curso_id integer
);


ALTER TABLE public.pagamentos OWNER TO cobranca_user;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pagamentos_id_seq OWNER TO cobranca_user;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: professores; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.professores (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true,
    pix character varying(255),
    cpf character varying(20),
    contato character varying(100),
    endereco text,
    dados_bancarios text
);


ALTER TABLE public.professores OWNER TO cobranca_user;

--
-- Name: professores_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.professores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.professores_id_seq OWNER TO cobranca_user;

--
-- Name: professores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.professores_id_seq OWNED BY public.professores.id;


--
-- Name: templates_mensagem; Type: TABLE; Schema: public; Owner: cobranca_user
--

CREATE TABLE public.templates_mensagem (
    id integer NOT NULL,
    titulo character varying(100) NOT NULL,
    conteudo text NOT NULL
);


ALTER TABLE public.templates_mensagem OWNER TO cobranca_user;

--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE; Schema: public; Owner: cobranca_user
--

CREATE SEQUENCE public.templates_mensagem_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.templates_mensagem_id_seq OWNER TO cobranca_user;

--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cobranca_user
--

ALTER SEQUENCE public.templates_mensagem_id_seq OWNED BY public.templates_mensagem.id;


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: cursos id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.cursos ALTER COLUMN id SET DEFAULT nextval('public.cursos_id_seq'::regclass);


--
-- Name: matriculas id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas ALTER COLUMN id SET DEFAULT nextval('public.matriculas_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: professores id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.professores ALTER COLUMN id SET DEFAULT nextval('public.professores_id_seq'::regclass);


--
-- Name: templates_mensagem id; Type: DEFAULT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.templates_mensagem ALTER COLUMN id SET DEFAULT nextval('public.templates_mensagem_id_seq'::regclass);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.clientes (id, nome, endereco, whatsapp, dia_vencimento, valor_padrao, professor_id, curso_id, active, created_at, valor_professor, valor_igreja) FROM stdin;
1	KLEBER	RUA ARAPONGA, 169, CASA 03	4899994329	10	0.00	\N	\N	t	2026-01-06 13:00:54.243861	0.00	0.00
23	Kaira		4888596403	10	0.00	\N	\N	t	2026-01-06 14:02:31.968892	0.00	0.00
15	LAVINIA	rua maria cândida dos santos,4	4891369464	10	0.00	\N	\N	t	2026-01-06 14:02:31.952391	0.00	0.00
13	MATHEUS	RUA DON AFONSO NIEHUES, 389	4891225387	10	0.00	\N	\N	t	2026-01-06 14:02:31.950448	0.00	0.00
18	NATHAN	RUA DEZENOVE DE MARÇO - 200 / AP 1304	4891564558	10	0.00	\N	\N	t	2026-01-06 14:02:31.96226	0.00	0.00
20	NICOLAS		4891564558	10	0.00	\N	\N	t	2026-01-06 14:02:31.965018	0.00	0.00
19	Tayna	Rua João Luiz Farias 221	48999613305	10	0.00	\N	\N	t	2026-01-06 14:02:31.963989	0.00	0.00
27	Viviany		48988052134	10	0.00	\N	\N	t	2026-01-06 14:02:31.976606	0.00	0.00
6	HENRY		4884474129	10	130.00	1	1	t	2026-01-06 14:02:31.939805	130.00	0.00
26	Josselaine		48991032202	10	100.00	4	4	t	2026-01-06 14:02:31.974513	100.00	0.00
28	Flavia Martins		4891124058	10	100.00	4	4	t	2026-01-06 14:02:31.979138	100.00	0.00
25	Fatima		4896070444	10	50.00	4	3	f	2026-01-06 14:02:31.97244	50.00	0.00
12	ADRIAN	RUA SEBASTIANA FERREIRA DE SOUZA	4888208803	10	0.00	\N	\N	t	2026-01-06 14:02:31.949105	0.00	0.00
2	CALLEB		4884278014	10	130.00	1	1	f	2026-01-06 14:02:31.929917	130.00	0.00
24	Daniel		48991776383	10	50.00	4	3	f	2026-01-06 14:02:31.970915	50.00	0.00
3	ALICE	SERVIDAO MANOEL ANTONIO VIEIRA - 61	4898114035	10	0.00	\N	\N	t	2026-01-06 14:02:31.934897	0.00	0.00
4	AMINAH	SERVIDAO MANOEL ANTONIO VIEIRA - 61	4898114035	10	0.00	\N	\N	t	2026-01-06 14:02:31.93671	0.00	0.00
10	CARLOS	RUA FERNANDO JOSÉ DUTRA	4896129937	10	0.00	\N	\N	t	2026-01-06 14:02:31.946545	0.00	0.00
22	Claudete		4899425142	10	0.00	\N	\N	t	2026-01-06 14:02:31.968011	0.00	0.00
21	Claudinéia	rua Maria estefana 90  Rio grande Palhoça sc	48999006020	10	0.00	\N	\N	t	2026-01-06 14:02:31.96713	0.00	0.00
16	DANIELA		4891564558	10	0.00	\N	\N	t	2026-01-06 14:02:31.955014	0.00	0.00
9	DANILO	RUA DOCILICIO LUZ - 415	4896163985	10	0.00	\N	\N	t	2026-01-06 14:02:31.944464	0.00	0.00
7	DAVI		4891124058	10	0.00	\N	\N	t	2026-01-06 14:02:31.941498	0.00	0.00
5	DAVID	RUA DEZENOVE DE MARÇO - 200 / AP 1304	4891564558	10	0.00	\N	\N	t	2026-01-06 14:02:31.938135	0.00	0.00
11	HENRI 	RUA ANTONIO JOSE PORTO - 8	4888586721	10	0.00	\N	\N	t	2026-01-06 14:02:31.947512	0.00	0.00
14	HENRIQUE	RUA SAMUEL DE SOUZA - 130	4896861213	10	0.00	\N	\N	t	2026-01-06 14:02:31.951489	0.00	0.00
8	ISABELA	RUA ANTONIO JOSE PORTO - 8	4888586721	10	0.00	\N	\N	t	2026-01-06 14:02:31.942985	0.00	0.00
17	ISMAEL	AV. ATLANTICA 626 AP 402	4892078003	10	0.00	\N	\N	t	2026-01-06 14:02:31.961286	0.00	0.00
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.cursos (id, nome, mensalidade_padrao, created_at, active) FROM stdin;
1	INSTRUMENTO	110.00	2026-01-06 14:02:31.914968	t
3	CURSO	50.00	2026-01-06 14:02:31.970478	t
4	PODCAST	70.00	2026-01-06 14:02:31.975789	t
2	CANTO	150.00	2026-01-06 14:02:31.963576	t
\.


--
-- Data for Name: matriculas; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.matriculas (id, cliente_id, curso_id, professor_id, dia_vencimento, valor_mensalidade, valor_professor, valor_igreja, active, created_at) FROM stdin;
2	2	1	1	10	130.00	130.00	0.00	t	2026-01-07 13:36:21.050297
21	24	3	4	10	50.00	50.00	0.00	t	2026-01-07 13:36:21.050297
22	27	4	4	10	70.00	70.00	0.00	t	2026-01-07 13:36:21.050297
23	26	4	4	10	100.00	100.00	0.00	t	2026-01-07 13:36:21.050297
24	28	4	4	10	100.00	100.00	0.00	t	2026-01-07 13:36:21.050297
28	25	3	4	10	50.00	50.00	0.00	f	2026-01-07 13:36:21.050297
29	16	1	1	10	110.00	\N	110.00	f	2026-01-07 17:31:19.320548
30	16	1	2	10	110.00	100.00	10.00	f	2026-01-07 18:04:35.27187
17	16	2	3	10	150.00	120.00	30.00	f	2026-01-07 13:36:21.050297
31	16	2	1	15	150.00	100.00	50.00	f	2026-01-07 18:04:51.910139
32	16	2	1	10	110.00	100.00	10.00	f	2026-01-07 18:16:44.06458
33	16	3	1	15	130.00	100.00	30.00	f	2026-01-07 18:23:07.644032
5	6	1	1	10	130.00	100.00	30.00	t	2026-01-07 13:36:21.050297
27	12	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
26	3	1	1	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
3	4	1	1	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
9	10	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
19	22	2	3	10	150.00	120.00	30.00	t	2026-01-07 13:36:21.050297
18	21	2	3	10	150.00	120.00	30.00	t	2026-01-07 13:36:21.050297
34	16	2	3	10	150.00	120.00	30.00	t	2026-01-07 19:08:50.64808
35	16	1	2	10	110.00	100.00	10.00	t	2026-01-07 19:09:03.522383
36	16	1	2	10	110.00	100.00	10.00	t	2026-01-07 19:09:19.997476
8	9	1	1	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
6	7	1	1	10	130.00	100.00	30.00	t	2026-01-07 13:36:21.050297
4	5	1	1	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
25	11	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
11	14	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
7	8	1	1	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
13	17	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
1	1	1	1	5	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
20	23	2	3	10	150.00	120.00	30.00	t	2026-01-07 13:36:21.050297
12	15	1	2	10	130.00	100.00	30.00	t	2026-01-07 13:36:21.050297
10	13	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
14	18	1	2	10	110.00	100.00	10.00	t	2026-01-07 13:36:21.050297
16	20	2	3	10	150.00	120.00	30.00	t	2026-01-07 13:36:21.050297
15	19	2	3	10	150.00	120.00	30.00	t	2026-01-07 13:36:21.050297
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.pagamentos (id, cliente_id, mes_ref, valor_cobrado, data_vencimento, status, data_pagamento, created_at, valor_professor_recebido, valor_igreja_recebido, msg_lembrete_enviada, msg_vencimento_enviada, msg_atraso_enviada, matricula_id, professor_id, curso_id) FROM stdin;
300	21	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	150.00	0.00	f	f	f	18	3	2
301	22	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	150.00	0.00	f	f	f	19	3	2
302	23	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	150.00	0.00	f	f	f	20	3	2
304	27	2026-03	70.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	70.00	0.00	f	f	f	22	4	4
305	26	2026-03	100.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	100.00	0.00	f	f	f	23	4	4
306	28	2026-03	100.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	100.00	0.00	f	f	f	24	4	4
307	11	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	25	2	1
308	3	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	26	1	1
309	12	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	100.00	10.00	f	f	f	27	2	1
313	16	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-07 21:04:10.72854	120.00	30.00	f	f	f	34	3	2
314	16	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-07 21:04:10.72854	100.00	10.00	f	f	f	35	2	1
315	16	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-07 21:04:10.72854	100.00	10.00	f	f	f	36	2	1
316	16	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 21:04:18.041938	120.00	30.00	f	f	f	34	3	2
317	16	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 21:04:18.041938	100.00	10.00	f	f	f	35	2	1
318	16	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 21:04:18.041938	100.00	10.00	f	f	f	36	2	1
57	1	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	1	1	1
8	4	2026-01	55.00	2026-01-10	PENDENTE	\N	2026-01-06 14:02:31.937701	50.00	5.00	t	f	f	3	1	1
2	1	2026-01	55.00	2026-01-10	PENDENTE	\N	2026-01-06 14:02:31.928214	50.00	5.00	t	f	f	1	1	1
310	16	2026-01	150.00	2026-01-10	PAGO	2026-01-08	2026-01-07 19:19:09.148862	120.00	30.00	f	f	f	34	3	2
312	16	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-07 19:19:09.148862	100.00	10.00	f	f	f	36	2	1
311	16	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-07 19:19:09.148862	100.00	10.00	f	f	f	35	2	1
10	5	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:02:31.939287	100.00	10.00	f	f	f	4	1	1
141	1	2026-04	110.00	2026-04-05	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	1	1	1
113	1	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	1	1	1
85	1	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	1	1	1
144	4	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	3	1	1
116	4	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	3	1	1
60	4	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	3	1	1
88	4	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	3	1	1
145	5	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	4	1	1
117	5	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	4	1	1
61	5	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	4	1	1
89	5	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	4	1	1
146	6	2026-04	130.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	5	1	1
118	6	2026-11	130.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	5	1	1
62	6	2026-12	130.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	5	1	1
90	6	2026-02	130.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	5	1	1
147	7	2026-04	130.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	6	1	1
119	7	2026-11	130.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	6	1	1
44	15	2026-01	130.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	\N	\N	t	f	f	12	2	1
63	7	2026-12	130.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	6	1	1
91	7	2026-02	130.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	6	1	1
42	13	2026-01	110.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	\N	\N	t	f	f	10	2	1
148	8	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	7	1	1
120	8	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	7	1	1
64	8	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	7	1	1
92	8	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	7	1	1
149	9	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	8	1	1
121	9	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	8	1	1
65	9	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	8	1	1
93	9	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	8	1	1
150	10	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	9	2	1
122	10	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	9	2	1
66	10	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	9	2	1
94	10	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	9	2	1
151	13	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	10	2	1
124	13	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	10	2	1
97	13	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	10	2	1
69	13	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	10	2	1
45	17	2026-01	110.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	100.00	10.00	t	f	f	13	2	1
152	14	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	11	2	1
125	14	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	11	2	1
98	14	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	11	2	1
70	14	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	11	2	1
153	15	2026-04	130.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	12	2	1
126	15	2026-11	130.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	12	2	1
99	15	2026-02	130.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	12	2	1
71	15	2026-12	130.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	12	2	1
154	17	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	13	2	1
127	17	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	13	2	1
100	17	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	13	2	1
72	17	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	13	2	1
43	14	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	100.00	10.00	f	f	f	11	2	1
155	18	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	14	2	1
128	18	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	14	2	1
101	18	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	14	2	1
73	18	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	14	2	1
156	19	2026-04	150.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	15	3	2
129	19	2026-11	150.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	15	3	2
102	19	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	15	3	2
74	19	2026-12	150.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	15	3	2
46	18	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	100.00	10.00	f	f	f	14	2	1
157	20	2026-04	150.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	16	3	2
130	20	2026-11	150.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	16	3	2
103	20	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	16	3	2
75	20	2026-12	150.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	16	3	2
40	10	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	100.00	10.00	t	f	f	9	2	1
50	21	2026-01	150.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	120.00	30.00	t	f	f	18	3	2
48	20	2026-01	150.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	120.00	30.00	f	f	f	16	3	2
47	19	2026-01	150.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	120.00	30.00	t	f	f	15	3	2
16	8	2026-01	55.00	2026-01-10	PENDENTE	\N	2026-01-06 14:02:31.943909	50.00	5.00	t	f	f	7	1	1
159	21	2026-04	150.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	18	3	2
132	21	2026-11	150.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	18	3	2
18	9	2026-01	0.00	2026-01-10	PAGO	2026-01-07	2026-01-06 14:02:31.945363	0.00	0.00	f	f	f	8	1	1
14	7	2026-01	0.00	2026-01-10	PAGO	2026-01-07	2026-01-06 14:02:31.942532	0.00	0.00	f	f	f	6	1	1
12	6	2026-01	0.00	2026-01-10	PAGO	2026-01-07	2026-01-06 14:02:31.940778	0.00	0.00	f	f	f	5	1	1
77	21	2026-12	150.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	18	3	2
160	22	2026-04	150.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	19	3	2
133	22	2026-11	150.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	19	3	2
78	22	2026-12	150.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	19	3	2
41	12	2026-01	110.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	100.00	10.00	f	f	f	27	2	1
161	23	2026-04	150.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	20	3	2
134	23	2026-11	150.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	20	3	2
107	23	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	20	3	2
79	23	2026-12	150.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	20	3	2
6	3	2026-01	55.00	2026-01-10	PENDENTE	\N	2026-01-06 14:02:31.93617	50.00	5.00	t	f	f	26	1	1
164	27	2026-04	70.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	22	4	4
137	27	2026-11	70.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	22	4	4
54	27	2026-01	70.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	\N	\N	f	f	f	22	4	4
110	27	2026-02	70.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	22	4	4
82	27	2026-12	70.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	22	4	4
165	26	2026-04	100.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	23	4	4
138	26	2026-11	100.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	23	4	4
111	26	2026-02	100.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	23	4	4
83	26	2026-12	100.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	23	4	4
56	28	2026-01	100.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	\N	\N	f	f	f	24	4	4
166	28	2026-04	100.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	24	4	4
139	28	2026-11	100.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	24	4	4
112	28	2026-02	100.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	24	4	4
84	28	2026-12	100.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	24	4	4
52	24	2026-01	50.00	2026-01-10	PAGO	2026-01-08	2026-01-06 14:06:19.001981	50.00	0.00	f	f	f	21	4	3
167	11	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	25	2	1
140	11	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	25	2	1
67	11	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	25	2	1
95	11	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	25	2	1
51	22	2026-01	150.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	120.00	30.00	t	f	f	19	3	2
168	3	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	\N	\N	f	f	f	26	1	1
115	3	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	\N	\N	f	f	f	26	1	1
59	3	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	\N	\N	f	f	f	26	1	1
87	3	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	\N	\N	f	f	f	26	1	1
55	26	2026-01	100.00	2026-01-10	PENDENTE	\N	2026-01-06 14:06:19.001981	100.00	50.00	t	f	f	23	4	4
142	12	2026-04	110.00	2026-04-10	PENDENTE	\N	2026-01-06 22:30:06.928237	100.00	10.00	f	f	f	27	2	1
123	12	2026-11	110.00	2026-11-10	PENDENTE	\N	2026-01-06 18:27:34.657526	100.00	10.00	f	f	f	27	2	1
68	12	2026-12	110.00	2026-12-10	PENDENTE	\N	2026-01-06 17:43:38.274723	100.00	10.00	f	f	f	27	2	1
106	22	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	120.00	30.00	f	f	f	19	3	2
105	21	2026-02	150.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	120.00	30.00	f	f	f	18	3	2
284	1	2026-03	110.00	2026-03-05	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	1	1	1
286	4	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	3	1	1
287	5	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	4	1	1
288	6	2026-03	130.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	130.00	0.00	f	f	f	5	1	1
289	7	2026-03	130.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	130.00	0.00	f	f	f	6	1	1
290	8	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	7	1	1
291	9	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	8	1	1
292	10	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	9	2	1
293	13	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	10	2	1
294	14	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	11	2	1
295	15	2026-03	130.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	130.00	0.00	f	f	f	12	2	1
296	17	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	13	2	1
297	18	2026-03	110.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	110.00	0.00	f	f	f	14	2	1
298	19	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	150.00	0.00	f	f	f	15	3	2
299	20	2026-03	150.00	2026-03-10	PENDENTE	\N	2026-01-07 19:08:10.419055	150.00	0.00	f	f	f	16	3	2
96	12	2026-02	110.00	2026-02-10	PENDENTE	\N	2026-01-06 17:43:40.751089	100.00	10.00	f	f	f	27	2	1
21	11	2026-01	0.00	2026-01-10	PAGO	2026-01-07	2026-01-06 14:02:31.948554	0.00	0.00	f	f	f	25	2	1
34	23	2026-01	0.00	2026-01-10	PAGO	2026-01-07	2026-01-06 14:02:31.969749	0.00	0.00	f	f	f	20	3	2
\.


--
-- Data for Name: professores; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.professores (id, nome, created_at, active, pix, cpf, contato, endereco, dados_bancarios) FROM stdin;
4	PR. ALEX	2026-01-06 14:02:31.970132	t	\N	\N	\N	\N	\N
3	ALEX	2026-01-06 14:02:31.963182	t	6899884678				
2	ALEXANDRE	2026-01-06 14:02:31.946085	t	10199724911				
1	ABNER	2026-01-06 14:02:31.911316	t	12973993903				
\.


--
-- Data for Name: templates_mensagem; Type: TABLE DATA; Schema: public; Owner: cobranca_user
--

COPY public.templates_mensagem (id, titulo, conteudo) FROM stdin;
1	Cobrança Padrão	Olá {nome}, tudo bem? Passando para lembrar da sua mensalidade referente a {mes} no valor de R$ {valor}.
2	Em Atraso	Olá {nome}. Consta em nosso sistema uma pendência referente a {mes}. Valor atualizado: R$ {valor}. Podemos regularizar?
\.


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.clientes_id_seq', 28, true);


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.cursos_id_seq', 4, true);


--
-- Name: matriculas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.matriculas_id_seq', 36, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 318, true);


--
-- Name: professores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.professores_id_seq', 4, true);


--
-- Name: templates_mensagem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cobranca_user
--

SELECT pg_catalog.setval('public.templates_mensagem_id_seq', 2, true);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- Name: matriculas matriculas_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: professores professores_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_pkey PRIMARY KEY (id);


--
-- Name: templates_mensagem templates_mensagem_pkey; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.templates_mensagem
    ADD CONSTRAINT templates_mensagem_pkey PRIMARY KEY (id);


--
-- Name: pagamentos unique_matricula_mes; Type: CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT unique_matricula_mes UNIQUE (matricula_id, mes_ref);


--
-- Name: idx_pagamentos_cliente; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_cliente ON public.pagamentos USING btree (cliente_id);


--
-- Name: idx_pagamentos_mes; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_mes ON public.pagamentos USING btree (mes_ref);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: cobranca_user
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: clientes clientes_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: clientes clientes_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- Name: matriculas matriculas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: matriculas matriculas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: matriculas matriculas_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.matriculas
    ADD CONSTRAINT matriculas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- Name: pagamentos pagamentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: pagamentos pagamentos_matricula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_matricula_id_fkey FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id) ON DELETE SET NULL;


--
-- Name: pagamentos pagamentos_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cobranca_user
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id);


--
-- PostgreSQL database dump complete
--

\unrestrict AjKGqOnPA4N9rKH1Qt93ep7bQbjvBySA2tBPcOMVdWHKMAWrgEPo3CfmyifFPFX

