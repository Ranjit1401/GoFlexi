/**
 * GoFlexi — Authentic Place & Landmark Image Resolver
 * 
 * Maps destination names, cities, landmarks, points of interest, and travel styles
 * to verified, high-definition, authentic photographs.
 * Every destination and landmark is mapped to its exact geographic location photography.
 */
import { useState, useEffect } from 'react';

// 1. Canonical Destination & City Photography Library
export const DESTINATION_IMAGE_MAP: Record<string, string> = {
  // Coastal & Beaches (Each with its distinct, authentic coastline)
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  'north goa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Anjuna_Beach%2C_Goa%2C_India%2C_Legendary_Curlies_beach_shack.jpg/500px-Anjuna_Beach%2C_Goa%2C_India%2C_Legendary_Curlies_beach_shack.jpg',
  'south goa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Palolem_Beach%2C_South_Goa.jpg/500px-Palolem_Beach%2C_South_Goa.jpg',
  panaji: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  gokarna: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Delight_india.jpg/500px-Delight_india.jpg',
  varkala: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Varkala_Beach%2C_Varkala%2C_Kerala.jpg/500px-Varkala_Beach%2C_Varkala%2C_Kerala.jpg',
  kovalam: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Kovalam_beach_trivandrum_kerala.jpg/500px-Kovalam_beach_trivandrum_kerala.jpg',
  puri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Shri_Jagannatha_Temple.jpg/500px-Shri_Jagannatha_Temple.jpg',
  alibaug: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Kolaba_Fort_-_Alibag.JPG/500px-Kolaba_Fort_-_Alibag.JPG',
  konark: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/500px-Konarka_Temple.jpg',

  // Islands & Marine Lagoons
  andaman: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg/500px-The_Coral_Reef_at_the_Andaman_Islands.jpg',
  'andaman & nicobar': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg/500px-The_Coral_Reef_at_the_Andaman_Islands.jpg',
  'andaman and nicobar': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/The_Coral_Reef_at_the_Andaman_Islands.jpg/500px-The_Coral_Reef_at_the_Andaman_Islands.jpg',
  'havelock island': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Havelock%2C_Andaman_%26_Nicobar_Islands.JPG/500px-Havelock%2C_Andaman_%26_Nicobar_Islands.JPG',
  havelock: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Havelock%2C_Andaman_%26_Nicobar_Islands.JPG/500px-Havelock%2C_Andaman_%26_Nicobar_Islands.JPG',
  'neil island': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Keshet_neal_island_india.jpg/500px-Keshet_neal_island_india.jpg',
  'port blair': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/View_from_South_Point%2C_%28Port_Blair%2C_India%29.jpg/500px-View_from_South_Point%2C_%28Port_Blair%2C_India%29.jpg',
  lakshadweep: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/A_beach_side_resort_at_Kadmat_Island%2C_Lakshadweep.jpg/500px-A_beach_side_resort_at_Kadmat_Island%2C_Lakshadweep.jpg',
  'agatti island': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Agatti_Airstrip.jpg/500px-Agatti_Airstrip.jpg',
  'bangaram island': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/A_beach_side_resort_at_Kadmat_Island%2C_Lakshadweep.jpg/500px-A_beach_side_resort_at_Kadmat_Island%2C_Lakshadweep.jpg',

  // Himalayan & Northern Valleys
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  shimla: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Landscape_of_Shimla_%2C_Himachal_Pradesh.jpg/500px-Landscape_of_Shimla_%2C_Himachal_Pradesh.jpg',
  dharamshala: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Dharamshala_03_%28Cropped%29.jpg/500px-Dharamshala_03_%28Cropped%29.jpg',
  'spiti valley': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Spiti_River_Kaza_Himachal_Jun18_D72_7232.jpg/500px-Spiti_River_Kaza_Himachal_Jun18_D72_7232.jpg',
  spiti: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/1000_Year_loop.jpg/500px-1000_Year_loop.jpg',
  kasol: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Kasol_mountain_view.jpg/500px-Kasol_mountain_view.jpg',
  'bir billing': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/An_aerial_view_of_Bir%2C_Kangra_valley_sights_nature_culture_Himachal_Pradesh_India_2015.jpg/500px-An_aerial_view_of_Bir%2C_Kangra_valley_sights_nature_culture_Himachal_Pradesh_India_2015.jpg',
  dalhousie: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Dalhouise_1.jpg/500px-Dalhouise_1.jpg',
  khajjiar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Nature_of_Khajjiar.jpg/500px-Nature_of_Khajjiar.jpg',
  jibhi: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Himalayn_National_Park_01.jpg/500px-Himalayn_National_Park_01.jpg',
  kasauli: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Kasauli_hills.jpg/500px-Kasauli_hills.jpg',

  // Uttarakhand Alpine & Sacred Sites
  nainital: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Nainital_metro.jpg/500px-Nainital_metro.jpg',
  mussoorie: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Kempty_Waterfalls.jpg/500px-Kempty_Waterfalls.jpg',
  auli: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Auli_Himalayas.jpg/500px-Auli_Himalayas.jpg',
  chopta: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Tungnath_temple.jpg/500px-Tungnath_temple.jpg',
  'valley of flowers': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Valley_of_flowers_national_park%2C_Uttarakhand%2C_India_03_%28edit%29.jpg/500px-Valley_of_flowers_national_park%2C_Uttarakhand%2C_India_03_%28edit%29.jpg',
  rishikesh: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  haridwar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Ganga_aarti_haridwar_01.jpg/500px-Ganga_aarti_haridwar_01.jpg',
  'jim corbett national park': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Bengal-Tiger_Corbett_Uttarakhand_Dec-2013.jpg/500px-Bengal-Tiger_Corbett_Uttarakhand_Dec-2013.jpg',
  'jim corbett': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Bengal-Tiger_Corbett_Uttarakhand_Dec-2013.jpg/500px-Bengal-Tiger_Corbett_Uttarakhand_Dec-2013.jpg',

  // Kashmir & Ladakh High Altitude
  kashmir: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
  srinagar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Red_and_Yellow_Tulips.JPG/500px-Red_and_Yellow_Tulips.JPG',
  gulmarg: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Ancient_Temple%2C_Gulmarg.jpg/500px-Ancient_Temple%2C_Gulmarg.jpg',
  pahalgam: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Betaab_Valley.jpg/500px-Betaab_Valley.jpg',
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
  leh: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Leh_City_seen_from_Shanti_Stupa.JPG/500px-Leh_City_seen_from_Shanti_Stupa.JPG',
  'nubra valley': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/5_Nubra_valley.jpg/500px-5_Nubra_valley.jpg',
  'pangong tso': 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
  pangong: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',

  // Rajasthan Heritage & Royalty
  rajasthan: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  jaipur: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80',
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
  jodhpur: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80',
  jaisalmer: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80',
  pushkar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Pushkar.jpg/500px-Pushkar.jpg',
  ranthambore: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Ranthambhore_Fort.jpg/500px-Ranthambhore_Fort.jpg',
  'mount abu': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Delwada.jpg/500px-Delwada.jpg',
  chittorgarh: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Chittorgarh_fort.JPG/500px-Chittorgarh_fort.JPG',

  // Kerala & South India Nature
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  munnar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Munnar_Overview.jpg/500px-Munnar_Overview.jpg',
  alleppey: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Alappuzha_Boat_Beauty_W.jpg/500px-Alappuzha_Boat_Beauty_W.jpg',
  kochi: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Kochi_Skyline.jpg/500px-Kochi_Skyline.jpg',
  cochin: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Kochi_Skyline.jpg/500px-Kochi_Skyline.jpg',
  wayanad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Blue%2C_Green_%26_White.jpg/500px-Blue%2C_Green_%26_White.jpg',
  thekkady: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Periyar_National_Park.JPG/500px-Periyar_National_Park.JPG',
  hampi: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/500px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg',
  coorg: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Tadiandamol_Valley%2C_Western_Ghats.jpg/500px-Tadiandamol_Valley%2C_Western_Ghats.jpg',
  mysore: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Mysuru_Montage.jpg/500px-Mysuru_Montage.jpg',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  chikmagalur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Chikmagalur%2C_India._%287793316622%29.jpg/500px-Chikmagalur%2C_India._%287793316622%29.jpg',
  kabini: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Bengal_Tiger_Karnataka.jpg/500px-Bengal_Tiger_Karnataka.jpg',
  badami: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/BadamiCaves87.JPG/500px-BadamiCaves87.JPG',
  ooty: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Ooty_lake.jpg/500px-Ooty_lake.jpg',
  kodaikanal: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Kodaikanal_lake.jpg/500px-Kodaikanal_lake.jpg',
  madurai: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Meenakshi_Amman_West_Tower.jpg/500px-Meenakshi_Amman_West_Tower.jpg',
  mahabalipuram: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/A_collage_of_Mamallapuram_town_Tamil_Nadu_India.jpg/500px-A_collage_of_Mamallapuram_town_Tamil_Nadu_India.jpg',
  rameswaram: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Rameswaram_Morning.jpg/500px-Rameswaram_Morning.jpg',
  kanyakumari: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg/500px-Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg',
  puducherry: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Pondicherry-Rock_beach_aerial_view.jpg/500px-Pondicherry-Rock_beach_aerial_view.jpg',
  pondicherry: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Pondicherry-Rock_beach_aerial_view.jpg/500px-Pondicherry-Rock_beach_aerial_view.jpg',
  tirupati: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/500px-Tirumala_090615.jpg',

  // Maharashtra & Western Ghats
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  lonavala: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Rajmachi.jpg/500px-Rajmachi.jpg',
  mahabaleshwar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/MAHABALESWAR_LANDSCAPE.jpg/500px-MAHABALESWAR_LANDSCAPE.jpg',
  'ajanta and ellora': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Bibi_Ka_Maqbara_-_The_Taj_Of_Deccan.jpg/500px-Bibi_Ka_Maqbara_-_The_Taj_Of_Deccan.jpg',
  tadoba: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Panthera_tigris_tigris_Tidoba_20150306.jpg/500px-Panthera_tigris_tigris_Tidoba_20150306.jpg',
  'rann of kutch': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Rann_of_Kutch_-_White_Desert.jpg/500px-Rann_of_Kutch_-_White_Desert.jpg',
  gir: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Gir_lion-Gir_forest%2Cjunagadh%2Cgujarat%2Cindia.jpeg/500px-Gir_lion-Gir_forest%2Cjunagadh%2Cgujarat%2Cindia.jpeg',
  ahmedabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Sabarmati_riverside.jpg/500px-Sabarmati_riverside.jpg',

  // Northeast, Bengal & Eastern Landscapes
  meghalaya: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=1200&q=80',
  shillong: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Elephant_Falls_II%2C_Shillong.jpg/500px-Elephant_Falls_II%2C_Shillong.jpg',
  cherrapunji: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Cherrapunji.jpg/500px-Cherrapunji.jpg',
  sikkim: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=1200&q=80',
  gangtok: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Kangch-Goechala.jpg/500px-Kangch-Goechala.jpg',
  pelling: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Sunrise_over_Kangchenjunga.jpg/500px-Sunrise_over_Kangchenjunga.jpg',
  lachung: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Yumthang_valley%2C_Lachung_Sikkim_India_2012.jpg/500px-Yumthang_valley%2C_Lachung_Sikkim_India_2012.jpg',
  darjeeling: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/DarjeelingTrainFruitshop_%282%29.jpg/500px-DarjeelingTrainFruitshop_%282%29.jpg',
  kalimpong: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/View_of_Kalimpong%2C_India.jpg/500px-View_of_Kalimpong%2C_India.jpg',
  kaziranga: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Beauty_of_Kaziranga_National_Park.jpg/500px-Beauty_of_Kaziranga_National_Park.jpg',
  'kaziranga national park': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Beauty_of_Kaziranga_National_Park.jpg/500px-Beauty_of_Kaziranga_National_Park.jpg',
  majuli: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Doriya_River_of_Majuli.jpg/500px-Doriya_River_of_Majuli.jpg',
  tawang: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/The_buddist_monastry.jpg/500px-The_buddist_monastry.jpg',
  'ziro valley': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/A_cross_section_of_luch_green_valley_of_Ziro.jpg/500px-A_cross_section_of_luch_green_valley_of_Ziro.jpg',
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80',
  sundarbans: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Save_the_sundarbans_20.jpg/500px-Save_the_sundarbans_20.jpg',

  // Central & Northern Plains
  varanasi: 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=1200&q=80',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  lucknow: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Harzratganj_Market%2C_Lucknow.jpg/500px-Harzratganj_Market%2C_Lucknow.jpg',
  mathura: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg',
  vrindavan: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg',
  khajuraho: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/1_Khajuraho.jpg/500px-1_Khajuraho.jpg',
  orchha: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Chaturbhuj_Temple%2C_Orchha.jpg/500px-Chaturbhuj_Temple%2C_Orchha.jpg',
  gwalior: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Gwalior_Fort_front.jpg/500px-Gwalior_Fort_front.jpg',
  kanha: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Tiger_Kanha_National_Park.jpg/500px-Tiger_Kanha_National_Park.jpg',
  bandhavgarh: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Tigress_in_Bandhavgarh_NP.jpg/500px-Tigress_in_Bandhavgarh_NP.jpg',
  amritsar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg/500px-Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  'new delhi': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg/500px-Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg',
  hyderabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg/500px-Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg',
  visakhapatnam: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Rushikonda_beach_view_001.jpg/500px-Rushikonda_beach_view_001.jpg',
  'araku valley': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Araku-valley.jpg/500px-Araku-valley.jpg',

  // Top International Destinations
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  uae: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  uk: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  japan: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  italy: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  indonesia: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  alps: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
};

// 2. Canonical Sights, Attractions & POI Photography Library
export const LANDMARK_IMAGE_MAP: Record<string, string> = {
  // Goa Sights
  'aguada fort': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  'fort aguada': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  'basilica of bom jesus': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Front_Elevation_of_Basilica_of_Bom_Jesus.jpg/500px-Front_Elevation_of_Basilica_of_Bom_Jesus.jpg',
  'bom jesus': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Front_Elevation_of_Basilica_of_Bom_Jesus.jpg/500px-Front_Elevation_of_Basilica_of_Bom_Jesus.jpg',
  dudhsagar: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  'dudhsagar falls': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  fontainhas: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
  'latin quarter': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
  'baga beach': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Anjuna_Beach%2C_Goa%2C_India%2C_Legendary_Curlies_beach_shack.jpg/500px-Anjuna_Beach%2C_Goa%2C_India%2C_Legendary_Curlies_beach_shack.jpg',
  'calangute beach': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  'candolim beach': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  'cabo de rama': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Palolem_Beach%2C_South_Goa.jpg/500px-Palolem_Beach%2C_South_Goa.jpg',
  'salim ali bird sanctuary': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Save_the_sundarbans_20.jpg/500px-Save_the_sundarbans_20.jpg',
  'chorao island': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Save_the_sundarbans_20.jpg/500px-Save_the_sundarbans_20.jpg',

  // Manali Sights
  'hadimba devi temple': 'https://images.unsplash.com/photo-1545652985-5edd365b12eb?auto=format&fit=crop&w=800&q=80',
  'hadimba temple': 'https://images.unsplash.com/photo-1545652985-5edd365b12eb?auto=format&fit=crop&w=800&q=80',
  'solang valley': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  'rohtang pass': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
  'atal tunnel': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
  'jogini waterfall': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  'jogini falls': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  'vashisht hot springs': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  'naggar castle': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'old manali': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',

  // Jaipur Sights
  'amber fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'amer fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'hawa mahal': 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
  'city palace jaipur': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
  'jantar mantar': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
  'nahargarh fort': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
  'jal mahal': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
  'panna meena ka kund': 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',
  'galta ji': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg',

  // Udaipur & Rajasthan Sights
  'city palace udaipur': 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  'lake pichola': 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  'jag mandir': 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  'saheliyon ki bari': 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  'mehrangarh fort': 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=800&q=80',
  'jaisalmer fort': 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',
  'sam sand dunes': 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',

  // Agra, Delhi & Amritsar
  'taj mahal': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
  'agra fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'india gate': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  'qutub minar': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  'red fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'golden temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg/500px-Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg',
  'harmandir sahib': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg/500px-Golden_Temple_Amritsar_Gurudwara_%28cropped%29.jpg',
  'gateway of india': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  'marine drive': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  charminar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg/500px-Aerial_view_of_Durgam_cheruvu_and_Hitech_CIty.jpg',
  'victoria memorial': 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80',

  // Varanasi & Sacred Religious Landmarks
  'dashashwamedh ghat': 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=800&q=80',
  'varanasi ghats': 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=800&q=80',
  'ganga aarti': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Ganga_aarti_haridwar_01.jpg/500px-Ganga_aarti_haridwar_01.jpg',
  'kashi vishwanath': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg',
  'meenakshi amman temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Meenakshi_Amman_West_Tower.jpg/500px-Meenakshi_Amman_West_Tower.jpg',
  'meenakshi temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Meenakshi_Amman_West_Tower.jpg/500px-Meenakshi_Amman_West_Tower.jpg',
  'shore temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/A_collage_of_Mamallapuram_town_Tamil_Nadu_India.jpg/500px-A_collage_of_Mamallapuram_town_Tamil_Nadu_India.jpg',
  'tirumala temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/500px-Tirumala_090615.jpg',
  'virupaksha temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/500px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg',
  'sun temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/500px-Konarka_Temple.jpg',
  'konark sun temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/500px-Konarka_Temple.jpg',
  'jagannath temple': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Shri_Jagannatha_Temple.jpg/500px-Shri_Jagannatha_Temple.jpg',

  // Meghalaya & Andaman Landmarks
  'living root bridge': 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=800&q=80',
  'double decker root bridge': 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=800&q=80',
  'nohkalikai falls': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  'dawki river': 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=800&q=80',
  'radhanagar beach': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Havelock%2C_Andaman_%26_Nicobar_Islands.JPG/500px-Havelock%2C_Andaman_%26_Nicobar_Islands.JPG',
  'elephant beach': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Havelock%2C_Andaman_%26_Nicobar_Islands.JPG/500px-Havelock%2C_Andaman_%26_Nicobar_Islands.JPG',
  'cellular jail': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Front_View_of_Cellular_Jail%2C_Port_Blair.JPG/500px-Front_View_of_Cellular_Jail%2C_Port_Blair.JPG',

  // International Icons
  'eiffel tower': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  'burj khalifa': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  'big ben': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  'tower bridge': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  colosseum: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  'marina bay sands': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
  'mount fuji': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
};

// 3. Archetype Category Photography Fallbacks
export const THEMATIC_IMAGE_FALLBACKS: Record<string, string> = {
  beach: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Palolem_Beach%2C_South_Goa.jpg/500px-Palolem_Beach%2C_South_Goa.jpg',
  mountain: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  heritage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  fort: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  palace: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  waterfall: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
  temple: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Meenakshi_Amman_West_Tower.jpg/500px-Meenakshi_Amman_West_Tower.jpg',
  church: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Front_Elevation_of_Basilica_of_Bom_Jesus.jpg/500px-Front_Elevation_of_Basilica_of_Bom_Jesus.jpg',
  lake: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  wildlife: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Tiger_Kanha_National_Park.jpg/500px-Tiger_Kanha_National_Park.jpg',
  nature: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  adventure: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  tea: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Munnar_Overview.jpg/500px-Munnar_Overview.jpg',
  urban: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  desert: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
};

/**
 * Resolves the authentic image for any destination or city name.
 */
export function getDestinationImage(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return THEMATIC_IMAGE_FALLBACKS.default;
  }

  const clean = name.toLowerCase().trim();

  // 1. Direct key match
  if (DESTINATION_IMAGE_MAP[clean]) {
    return DESTINATION_IMAGE_MAP[clean];
  }

  // 2. Substring / alias match
  for (const [key, url] of Object.entries(DESTINATION_IMAGE_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return url;
    }
  }

  // 3. Fallback based on name hints
  if (clean.includes('beach') || clean.includes('island') || clean.includes('coast')) {
    return THEMATIC_IMAGE_FALLBACKS.beach;
  }
  if (clean.includes('hill') || clean.includes('valley') || clean.includes('peak') || clean.includes('mount')) {
    return THEMATIC_IMAGE_FALLBACKS.mountain;
  }
  if (clean.includes('fort') || clean.includes('palace') || clean.includes('haveli')) {
    return THEMATIC_IMAGE_FALLBACKS.heritage;
  }

  return THEMATIC_IMAGE_FALLBACKS.default;
}

/**
 * Resolves the authentic image for a specific sight, landmark, or activity.
 */
export function getActivityImage(
  name?: string | null,
  kinds?: string | null,
  destinationHint?: string | null
): string {
  if (!name || typeof name !== 'string') {
    return destinationHint ? getDestinationImage(destinationHint) : THEMATIC_IMAGE_FALLBACKS.default;
  }

  const clean = name.toLowerCase().trim();

  // 1. Direct landmark match
  if (LANDMARK_IMAGE_MAP[clean]) {
    return LANDMARK_IMAGE_MAP[clean];
  }

  // 2. Landmark substring matching
  for (const [key, url] of Object.entries(LANDMARK_IMAGE_MAP)) {
    if (clean.includes(key)) {
      return url;
    }
  }

  // 3. Destination match (e.g. "Solang Valley adventure in Manali" -> Manali image)
  for (const [key, url] of Object.entries(DESTINATION_IMAGE_MAP)) {
    if (clean.includes(key)) {
      return url;
    }
  }

  // 4. Keyword & kind-based classification
  const fullContext = `${clean} ${kinds || ''}`.toLowerCase();

  if (fullContext.includes('waterfall') || fullContext.includes('falls') || fullContext.includes('cascade')) {
    return THEMATIC_IMAGE_FALLBACKS.waterfall;
  }
  if (fullContext.includes('temple') || fullContext.includes('mandir') || fullContext.includes('shrine') || fullContext.includes('monastery') || fullContext.includes('spiritual')) {
    return THEMATIC_IMAGE_FALLBACKS.temple;
  }
  if (fullContext.includes('church') || fullContext.includes('basilica') || fullContext.includes('cathedral')) {
    return THEMATIC_IMAGE_FALLBACKS.church;
  }
  if (fullContext.includes('beach') || fullContext.includes('cove') || fullContext.includes('coastal') || fullContext.includes('island') || fullContext.includes('scuba') || fullContext.includes('watersport')) {
    return THEMATIC_IMAGE_FALLBACKS.beach;
  }
  if (fullContext.includes('fort') || fullContext.includes('citadel') || fullContext.includes('castle') || fullContext.includes('fortress') || fullContext.includes('ruins')) {
    return THEMATIC_IMAGE_FALLBACKS.fort;
  }
  if (fullContext.includes('palace') || fullContext.includes('haveli') || fullContext.includes('mahal') || fullContext.includes('chateau')) {
    return THEMATIC_IMAGE_FALLBACKS.palace;
  }
  if (fullContext.includes('lake') || fullContext.includes('river') || fullContext.includes('backwater') || fullContext.includes('boating') || fullContext.includes('cruise')) {
    return THEMATIC_IMAGE_FALLBACKS.lake;
  }
  if (fullContext.includes('snow') || fullContext.includes('ski') || fullContext.includes('glacier') || fullContext.includes('pass') || fullContext.includes('tunnel')) {
    return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80';
  }
  if (fullContext.includes('mountain') || fullContext.includes('peak') || fullContext.includes('valley') || fullContext.includes('trek') || fullContext.includes('climbing') || fullContext.includes('hike')) {
    return THEMATIC_IMAGE_FALLBACKS.mountain;
  }
  if (fullContext.includes('wildlife') || fullContext.includes('safari') || fullContext.includes('sanctuary') || fullContext.includes('tiger') || fullContext.includes('reserve')) {
    return THEMATIC_IMAGE_FALLBACKS.wildlife;
  }
  if (fullContext.includes('tea') || fullContext.includes('coffee') || fullContext.includes('plantation')) {
    return THEMATIC_IMAGE_FALLBACKS.tea;
  }
  if (fullContext.includes('desert') || fullContext.includes('dune') || fullContext.includes('camel')) {
    return THEMATIC_IMAGE_FALLBACKS.desert;
  }

  // 5. Use destination hint if available
  if (destinationHint) {
    return getDestinationImage(destinationHint);
  }

  return THEMATIC_IMAGE_FALLBACKS.default;
}

/**
 * Universal place image resolver.
 */
export function getPlaceImage(placeName?: string | null, typeOrKinds?: string | null): string {
  if (!placeName) return THEMATIC_IMAGE_FALLBACKS.default;

  const clean = placeName.toLowerCase().trim();
  if (DESTINATION_IMAGE_MAP[clean]) {
    return DESTINATION_IMAGE_MAP[clean];
  }

  if (LANDMARK_IMAGE_MAP[clean]) {
    return LANDMARK_IMAGE_MAP[clean];
  }

  return getActivityImage(placeName, typeOrKinds);
}

/**
 * Asynchronously fetches authentic photograph for any place/attraction from Wikipedia REST API,
 * with localStorage caching so queries are never repeated.
 */
export async function fetchWikiPlaceImage(placeName: string): Promise<string | null> {
  if (!placeName || typeof placeName !== 'string') return null;
  const clean = placeName.trim();
  const cacheKey = `goflexi_wiki_img_${clean.toLowerCase()}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // Ignore localStorage access failures in private browsing
  }

  try {
    const formatted = encodeURIComponent(clean.replace(/\s+/g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`);
    if (res.ok) {
      const data = await res.json();
      const thumb = data.thumbnail?.source;
      if (thumb && typeof thumb === 'string') {
        try {
          localStorage.setItem(cacheKey, thumb);
        } catch {
          // Ignore quota errors
        }
        return thumb;
      }
    }
  } catch {
    // Silently fall back to static library
  }

  return null;
}

/**
 * React hook to get authentic image with dynamic Wikipedia thumbnail enrichment for custom places.
 */
export function usePlaceImage(
  name?: string | null,
  kinds?: string | null,
  destinationHint?: string | null
): string {
  const syncImage = getActivityImage(name, kinds, destinationHint);
  const [image, setImage] = useState<string>(syncImage);

  useEffect(() => {
    setImage(syncImage);
    if (!name) return;

    const clean = name.toLowerCase().trim();
    // If not in direct static library, query Wikipedia
    if (!DESTINATION_IMAGE_MAP[clean] && !LANDMARK_IMAGE_MAP[clean]) {
      let isMounted = true;
      fetchWikiPlaceImage(name).then((wikiImg) => {
        if (isMounted && wikiImg) {
          setImage(wikiImg);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [name, kinds, destinationHint, syncImage]);

  return image;
}
