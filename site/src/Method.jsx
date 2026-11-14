import React from "react";
import { regionLabel } from "./i18n/terms.js";
import { Tag, Warn, Limitations, fmt } from "./common.jsx";
import PageIntro, { Term } from "./components/PageIntro.jsx";
import CopyPre from "./components/CopyPre.jsx";

const STEPS = ["Veri", "Hazırlık", "Özellik", "Karşılaştırılabilirlik", "Karşılaştırma", "Sonuç"];
const STEP_D = ["NASA yükseklik verisi: Dünya NASADEM, Ay LOLA, Mars CTX", "hepsi aynı 30 m ızgaraya", "eğim, yükseklik farkı, yüzey engebesi", "aralıkları örtüşmeyenler elenir", "dağılım farkı → arazi uzaklığı", "sıralı liste + eksik konular"];
const Sec = ({ title, children }) => <details className="msec"><summary><h2>{title}</h2></summary><div className="msec-body">{children}</div></details>;
const FORMULA = `Teknik adlar: D = arazi uzaklığı, d_k = değişken uzaklığı (eğim / yükseklik farkı / yüzey engebesi), O_k = örtüşme, P10/P50/P90 = tipik değer ve aralık, W1 = Wasserstein mesafesi, IQR = çeyrekler arası genişlik.
Değişkenler (yalnızca topografya): eğim, yerel röleyf (11×11, 330 m, max−min), pürüzlülük (z − ort_5x5(z) artığının 11×11 RMS'i)
Filtre:  O_k = |[c10,c90] ∩ [r10,r90]| / (r90 − r10)  >= 0.5  her k için ve geçerli piksel >= %90
d_k   =  W1(F_aday,k , F_ref,k) / IQR(F_ref,k)     (scipy wasserstein_distance, 20 000 piksellik alt örnek, seed = 42)
D     =  (d_eğim + d_röleyf + d_pürüzlülük) / 3     eşit ağırlık; kullanıcı tarafından değiştirilemez
Sıra: D küçükten büyüğe (düşük = daha yakın). Benzerlik % veya güven puanı üretilmez.`;

export default function Method({ lim, valid, controls, inventory, expl }) {
  const pc = controls?.positive_control;
  const vb = pc?.two_views?.view_B_no_match_reported_separately;
  const va = pc?.two_views?.view_A_no_match_counted_as_last_group;
  const neg = controls?.negative_control;
  return (
    <div>
      <PageIntro purpose="Dünya'daki daha az incelenmiş arazi pencerelerinin Ay/Mars referanslarına topografik olarak ne kadar yaklaştığını ve bu karşılaştırmanın nerede bittiğini gösterir." how="Önce Kısaca kutusunu, sonra ilgilendiğin bölümü aç; her bölüm kapalı başlar." />
      <div className="card brief">
        <h2>Kısaca</h2>
        <ul>
          <li><strong>Ne karşılaştırılır:</strong> Dünya'daki 10×10 km arazi parçalarının <Term k="slope" />, <Term k="relief" /> ve <Term k="rough" /> değerleri; Ay'da Shackleton krateri çevresi veya Mars'ta Jezero krateri çevresiyle.</li>
          <li><strong>Hangi veri:</strong> NASA yükseklik ölçümleri (Dünya NASADEM 30 m, Ay LOLA, Mars CTX); ürün adı ve sürümü Veri envanteri bölümünde.</li>
          <li><strong>Hangi ölçü:</strong> her özellik için Dünya parçasındaki değerlerin dağılımı referansınkiyle kıyaslanır; üç farkın eşit ağırlıklı ortalaması <Term k="D" />dır (teknik ad: D).</li>
          <li><strong>Nasıl okunur:</strong> 0 = aynı, düşük = arazi şekli daha benzer. Fiziksel mesafe değil, arazi şekillerinin farkıdır. Sıralama içindir; "iyi/kötü" eşiği yoktur.</li>
          <li><strong>Neden yüzde veya güven puanı yok:</strong> arazi uzaklığı bir olasılık değildir; anlamı olmayan tek bir puan yanıltıcı olurdu. <Term k="coverage" /> ve <Term k="reliability" /> ayrı gösterilir.</li>
        </ul>
      </div>
      <Warn><strong>Dürüst not:</strong> pozitif kontrol ölçütü <strong>sağlanmadı</strong> (bilinen analogların medyan yüzdeliği ≤ %20 hedefine ulaşılamadı). Ayrıntı: Doğrulama bölümü. Bu yüzden yöntemin "doğrulandığı" söylenmez.</Warn>
      <ol className="flow" aria-label="Yöntem adımları">
        {STEPS.map((s, i) => <li key={s}><strong>{s}</strong><span>{STEP_D[i]}</span></li>)}
      </ol>

      <Sec title="Ortak ölçek ve ızgara">
        <p><Tag kind="der" />Tüm DEM'ler 30 m eşit alanlı yerel projeksiyona alan ortalamasıyla; eğim 30 m ızgarada Horn 3×3 (etkin taban ≈ 60 m); pencere 10 × 10 km (333 × 333 piksel), adım 5 km. Hiçbir ürün inceltilmez; Ay ve Mars'ın ince detayı bu ölçekte kaybolur.</p>
        <p>Sapma notu: bölge başına tek LAEA ızgarası kullanıldı (pencere merkezli değil); ≈ 500 km'de ölçek sapması %0,08.</p>
      </Sec>
      <Sec title="Değişkenler ve formüller">
        <CopyPre text={FORMULA} />
        <p>Duyarlılık analizi (pencere 5/20 km, ızgara 90 m, eşik 0,25/0,75, değişken çıkarma): <strong>yapılmadı</strong> (kesme listesi, süre). Eşikler bu sonuçlara göre ayarlanmadı.</p>
      </Sec>
      <Sec title="Filtre ve sıralama (örtüşme, değişken uzaklıkları, arazi uzaklığı)">
        <p>O_k: adayın P10–P90 aralığının referansın P10–P90 aralığıyla örtüşme oranı; her değişken için ≥ 0,5 ve geçerli piksel ≥ %90 olmayan pencere elenir. <Term k="d_slope">d_k</Term>: değişken başına W1/IQR. <Term k="D">D</Term>: üç d_k'nin eşit ağırlıklı ortalaması. Ağırlıklar sabittir.</p>
      </Sec>
      <Sec title="Termal değişkenler (neden puana girmiyor)">
        <p>Termal değişkenler puana ve filtreye <strong>girmez</strong>: Dünya LST (yüzey, iki örnek), Ay Diviner PRP (2 cm derinlik, model) ve Mars THEMIS (kalibre değil) eşdeğer nicelikler değildir; yalnızca Characterize ve Gap panelinde, ürün adıyla gösterilir. Mars termal: Veri eksik.</p>
      </Sec>
      <Sec title="Aday üretimi ve referans profiller">
        <p>Aday üretimi: ABD Güneybatı, Atacama, Hawaii Büyük Ada, Batı/Orta Anadolu. Bilinen analoglar aday üretiminde kullanılmaz; yalnızca pozitif kontrol ve "bilinen" etiketi içindir. Referans profilleri: Ay = Shackleton çevresi (LOLA, 3 ROI penceresi), Mars = Jezero çevresi (CTX DTM, R2).</p>
      </Sec>
      <Sec title="Doğrulama (pozitif ve negatif kontrol)">
        <h3>Pozitif kontrol <Tag kind="der" /></h3>
        <Warn><strong>Ölçüt sağlanmadı.</strong> Başarı ölçütü: bilinen analogların medyan yüzdeliği ≤ %20. Sonuç aşağıda olduğu gibi raporlanmıştır; parametreler veya eşikler bu sonuca göre ayarlanmadı. n = 5 test edildi (13 satırdan; 7 satırda koordinat yok, Salda su maskesi nedeniyle geçerli pencere dışı). Bölge dağılımı dengesiz (US-SW 4, HAW 1, ANA 1, ATA 0).</Warn>
        {pc && (
          <>
            <table>
              <thead><tr><th>Gösterim</th><th>Sonuç</th></tr></thead>
              <tbody>
                <tr><td><strong>A.</strong> D'si olmayan analog "son grup" sırası sayılır</td><td>n = {va?.n}; medyan yüzdelik {va?.median_percentile} (ölçüt ≤ 20) · Mann–Whitney tek yönlü p = {pc.mann_whitney?.["p_one_sided_(analog_lower_D_percentile)"]}</td></tr>
                <tr><td><strong>B.</strong> D'si olmayanlar ayrı: "eşleşme yok (O_k &lt; 0.25)"</td><td>{vb?.n_no_match_O_lt_0_25 ?? vb?.["n_no_match_O_lt_0.25"]} eşleşme yok ({vb?.no_match_rows?.join("; ")}); eşleşen {vb?.n_matched_D_available}: {Object.entries(vb?.matched_percentiles || {}).map(([k, v]) => `${k}: %${v}`).join("; ")}; yalnızca eşleşenlerin medyanı {vb?.median_percentile_matched_only}</td></tr>
              </tbody>
            </table>
            <p className="muted">{vb?.note}</p>
            <table>
              <thead><tr><th>Analog</th><th>Bölge / profil</th><th className="n">D</th><th className="n">Yüzdelik (A)</th><th>Durum (B)</th></tr></thead>
              <tbody>
                {pc.rows.map((r) => (
                  <tr key={r.id}><td>{r.id} {r.name}</td><td>{r.region ? regionLabel(r.region) : "—"} {r.profile ? "· " + r.profile.split(" (")[0] : ""}</td><td className="n">{fmt(r.D, 3)}</td><td className="n">{r.percentile_in_region ?? "—"}</td><td>{r.match_status || r.status}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="muted">{pc.WARNING}</p>
          </>
        )}
        <h3>Negatif kontrol <Tag kind="der" /></h3>
        <p>Bölge başına 200 rastgele pencere (seed = 42). Düz pencereler (eğim P90 &lt; 2°, n = {neg?.flat_windows_slope_p90_lt_2deg?.moon?.n_flat_windows}): Ay profilinde D alan {neg?.flat_windows_slope_p90_lt_2deg?.moon?.n_with_D}; son çeyrek/sıralanmayan {neg?.flat_windows_slope_p90_lt_2deg?.moon?.["n_in_last_quarter_(percentile>=75)"]}. Pencereler %50 örtüşür; p değerleri iyimser olabilir.</p>
        <table>
          <thead><tr><th>Bölge</th><th>Profil</th><th className="n">D'li / 200</th><th className="n">Filtreyi geçen</th><th>D P10 / P50 / P90</th></tr></thead>
          <tbody>
            {neg && Object.entries(neg.per_region).flatMap(([reg, o]) => Object.entries(o).map(([pf, v]) => (
              <tr key={reg + pf}><td>{regionLabel(reg)}</td><td>{pf === "moon" ? "Ay" : "Mars"}</td><td className="n">{v.n_with_D}</td><td className="n">{v.n_pass_filter}</td><td>{v["D_percentiles_(P10,P50,P90)"]?.join(" / ") ?? "Veri eksik"}</td></tr>
            )))}
          </tbody>
        </table>
        <h3>Sabit doğrulama notları (validation.json)</h3>
        {valid?.positive_control?.limitations?.map((t, i) => <Warn key={i}>{t}</Warn>)}
        <p className="muted">{valid?.positive_control?.interpretation_rule}</p>
      </Sec>

      {expl && (
        <Sec title="Sonradan yapılan keşifsel analiz: Ay referansı ayrı ayrı">
          <Warn><strong>Keşifsel (post-hoc).</strong> Bu analiz ana sonuçlar alındıktan sonra, havuzlanmış Ay referansı yerine Site01, Site04 ve Site07'nin ayrı ayrı kullanılmasıyla yapıldı. Ana sıralamayı, eşikleri veya pozitif kontrol sonucunu <strong>değiştirmez</strong>; hipotez testi olarak okunmamalıdır.</Warn>
          {expl.sites && Object.entries(expl.sites).map(([s, v]) => (
            <div key={s}>
              <h3>{s}</h3>
              <p>Referans P10/P50/P90: {Object.entries(v.reference).map(([k, r]) => `${k} ${r.join("/")}`).join(" · ")}. Filtreyi geçen pencere: {v.n_pass_filter} (D'li: {v.n_with_D}).</p>
              <table>
                <thead><tr><th>Analog</th><th>Durum</th><th className="n">D</th><th className="n">Yüzdelik</th></tr></thead>
                <tbody>{v.analogs.map((a) => <tr key={a.id}><td>{a.id} {a.name}</td><td>{a.status}</td><td className="n">{fmt(a.D, 3)}</td><td className="n">{a.percentile ?? "—"}</td></tr>)}</tbody>
              </table>
              <p className="muted">Medyan yüzdelik (A, eşleşmeyen = son grup): {v.median_A ?? "—"} · yalnızca eşleşenler: {v.median_B ?? "—"} (n = {v.n_matched}).</p>
            </div>
          ))}
          <p className="muted">{expl.note}</p>
        </Sec>
      )}

      <Sec title="Sınırlamalar (sabit)">
        <Limitations lim={lim} />
      </Sec>

      <Sec title="Veri envanteri ve kaynaklar (data_inventory.csv)">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>ID</th><th>Cisim</th><th>Ürün</th><th>Sürüm</th><th>Çözünürlük</th><th>Birim</th><th>Lisans</th><th>Durum</th></tr></thead>
            <tbody>
              {inventory?.map((r) => (
                <tr key={r.id}><td>{r.id}</td><td>{r.body}</td><td>{r.product}<div className="muted">{r.short_name}</div></td><td>{r.version}</td><td>{r.resolution}</td><td>{r.units_and_encoding}</td><td>{r.license_or_use}</td><td>{r.verification_status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><a href="data/data_inventory.csv">data_inventory.csv indir</a></p>
      </Sec>
    </div>
  );
}
