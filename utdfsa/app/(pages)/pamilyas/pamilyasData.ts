// ── pamilyasData.ts ───────────────────────────────────────
// static roster for "meet the pamilyas" on /pamilyas — one entry per pam,
// in display order. edit names/handles here, not in PamilyasClient.
//
// data:  logos + group photos from public/, imported statically so
//        next/image knows their intrinsic size (group photos render at
//        natural height) and serves resized copies of the large pngs
// notes: ported from the "FSA Pam Section Final" design (7a desktop, 8b
//        mobile). odd-index pams use the photo-right desktop layout and a
//        4:5 cover crop — photoPosition tunes that crop per photo.
//        kevalin staats heads both manila munchers and totaros — not a typo.
// ──────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import type { StaticImageData } from 'next/image'

import abgLogo from '@/public/abg-logo.png'
import abgPhoto from '@/public/abg-kuyates.jpg'
import fullHouseLogo from '@/public/full-house-logo.png'
import fullHousePhoto from '@/public/full-house-kuyates.png'
import manilaMunchersLogo from '@/public/manila-munchers-logo.png'
import manilaMunchersPhoto from '@/public/manila-munchers-kuyates.jpg'
import ubaesLogo from '@/public/ubaes-logo.png'
import ubaesPhoto from '@/public/ubaes-kuyates.jpg'
import pndLogo from '@/public/pnd-logo.png'
import pndPhoto from '@/public/pnd-kuyates.jpg'
import busogLogo from '@/public/busog-logo.jpg'
import busogPhoto from '@/public/busog-kuyates.jpg'
import totarosLogo from '@/public/totaros-logo.jpg'
import totarosPhoto from '@/public/totaros-kuyates.jpg'

export type PamPerson = {
  name: string
  /** instagram handle, no leading @ */
  handle: string
}

export type Pamilya = {
  name: string
  slogan: string
  instagram: string
  logo: StaticImageData
  /** circle behind the logo — matches each logo's own background */
  logoBg: 'white' | 'black'
  /** per-logo framing tweak (zoom/offset) so the mark fills the circle */
  logoStyle?: CSSProperties
  /** fit the whole logo inside a padded circle instead of cropping it */
  logoContain?: boolean
  photo: StaticImageData
  /** object-position for the 4:5 / photo-right cover crop */
  photoPosition?: string
  head: PamPerson
  kuyates: PamPerson[]
}

export const PAMILYAS: Pamilya[] = [
  {
    name: 'ABGs',
    slogan: 'Always. Be. Great.',
    instagram: 'dallasabgs',
    logo: abgLogo,
    logoBg: 'white',
    photo: abgPhoto,
    head: { name: 'Eric Wang', handle: 'notericwang' },
    kuyates: [
      { name: 'Aaron Tran', handle: 'aaronhtran' },
      { name: 'Keanu Lee', handle: '_keanulee_' },
      { name: 'Jasir Babac', handle: 'jazy.abc' },
      { name: 'Sydney Tran', handle: 'sydney.ttran' },
      { name: 'Rachel Cao', handle: 'rachelca0' },
      { name: 'Joanne Park', handle: 'haiiyoung_' },
      { name: 'Madison Nguyen', handle: 'madisonnguyyen' },
    ],
  },
  {
    name: 'Full House',
    slogan: 'Full pam, Full heart, Full house.',
    instagram: 'full.house.fsa',
    logo: fullHouseLogo,
    logoBg: 'black',
    logoStyle: { transform: 'scale(1.15)' },
    photo: fullHousePhoto,
    photoPosition: 'center 60%',
    head: { name: 'Skylar Dang', handle: 'synkdd' },
    kuyates: [
      { name: 'Simon Choi', handle: 'simon.choi03' },
      { name: 'Kenneth Le', handle: 'kennehleh' },
      { name: 'Brian Leung', handle: 'bruhian1' },
      { name: 'Livy Ker', handle: 'livyker' },
      { name: 'Kelsey Lim', handle: 'kelseyllim' },
      { name: 'Alyssa Le', handle: 'alyssasle' },
      { name: 'Belinda Cai', handle: '_belindacai_' },
    ],
  },
  {
    name: 'Manila Munchers',
    slogan: 'If you not a munch, you not a part of the bunch.',
    instagram: 'manilamunchers.pam',
    logo: manilaMunchersLogo,
    logoBg: 'white',
    logoContain: true,
    photo: manilaMunchersPhoto,
    head: { name: 'Kevalin Staats', handle: 'kevalinstaats' },
    kuyates: [
      { name: 'Leo Dos Remedios', handle: 'leodremedios' },
      { name: 'Czar Nonot', handle: 'czarnonot' },
      { name: 'Davin Paloma', handle: 'palomaaaa4639' },
      { name: 'Christine Nguyen', handle: 'yeochiwi' },
      { name: 'Phuc Tran', handle: 'pho0c' },
      { name: 'Zoe Zhang', handle: 'zoezhang8_' },
    ],
  },
  {
    name: 'U-Baes',
    slogan: 'It’s always been u-bae.',
    instagram: 'ubaes67',
    logo: ubaesLogo,
    logoBg: 'black',
    photo: ubaesPhoto,
    photoPosition: 'center 35%',
    head: { name: 'Chris Hay', handle: 'hay_christopher_' },
    kuyates: [
      { name: 'Adrian Hautea', handle: 'adhautea' },
      { name: 'Patrick Enerio', handle: 'jpatricke_' },
      { name: 'Vy Tran', handle: 'vtrhnn' },
      { name: 'Shayna Silvestre', handle: 'shaynasilv' },
      { name: 'Angelina Tran', handle: 'ang3lina_tran' },
    ],
  },
  {
    name: 'PamNextDoor',
    slogan: 'Welcome to the Party.',
    instagram: 'pam.next.door',
    logo: pndLogo,
    logoBg: 'black',
    logoStyle: { transform: 'translateX(-3%) scale(1.7)', transformOrigin: '52% 60%' },
    photo: pndPhoto,
    head: { name: 'Vinh Nguyen', handle: 'vinhngvyenn' },
    kuyates: [
      { name: 'Grace Pho', handle: 'grcp18' },
      { name: 'Jolie Nguyen', handle: 'jolie.ngvyen' },
      { name: 'Samuel Pham', handle: 'samuelphamm' },
      { name: 'Michael Tra', handle: 'mikeytratra' },
      { name: 'Cheynne Le', handle: 'chheynne' },
      { name: 'Genna Ibarra', handle: 'gennaur_' },
    ],
  },
  {
    name: 'Busog Bandits',
    slogan: 'No plate is safe.',
    instagram: 'busogbandits',
    logo: busogLogo,
    logoBg: 'white',
    logoStyle: { transform: 'scale(0.95)' },
    photo: busogPhoto,
    photoPosition: 'center',
    head: { name: 'Lance Martinez', handle: 'laurenz.martinez' },
    kuyates: [
      { name: 'Adil Siddiqui', handle: 'adilsdqi' },
      { name: 'Sahil Mohammad', handle: 'sahilmohammadd' },
      { name: 'Eyrick Navejar', handle: 'eyrick.jae' },
      { name: 'Raffi Abeleda', handle: 'ra.beleda' },
      { name: 'Aliyah Carabeo', handle: 'aliyah_carabeo' },
      { name: 'Bianka Wieneke', handle: 'biankaw12' },
      { name: 'Gia Toledo', handle: 'g1anna_t' },
    ],
  },
  {
    name: 'Totaros',
    slogan: 'Your neighbor, Totaros!',
    instagram: 'yourneighbortotaros',
    logo: totarosLogo,
    logoBg: 'white',
    photo: totarosPhoto,
    head: { name: 'Kevalin Staats', handle: 'kevalinstaats' },
    kuyates: [
      { name: 'Richard Garcia', handle: 'richardleegarciaiv' },
      { name: 'John Nguyen', handle: 'johnh.uynh' },
      { name: 'Michael Perez', handle: 'o_0michael' },
      { name: 'Trang Anh Nguyen', handle: 'trang._.anh.816' },
      { name: 'Ken Luong', handle: 'buggibutt' },
      { name: 'Jessica Nguyen', handle: 'jessic6.n' },
      { name: 'Daniel Nguyen', handle: 'danielnguywn' },
    ],
  },
]
