import { PiMagnifyingGlassBold } from "react-icons/pi";
import  Loader  from "../../components/Loader"

export const SearchForm = ({
  searchTerm, 
  selectedValue, 
  loading, 
  onSearchChange, 
  setSelectedValue, 
  onSearchSubmit,
  styles = {}
}) => (
  <form onSubmit={onSearchSubmit} className={styles.formSearch || "formsearch"}>
    <div className={styles.searchInputGroup || "input-field"}>
      <label>Buscar Doador</label>
      <input
        type="text"
        name="buscardoador"
        value={searchTerm}
        onChange={onSearchChange}
        className={styles.searchInput}
        placeholder="Digite o nome do doador..."
      />
    </div>
    <div className={styles.searchInputGroup || "input-field"}>
      <label htmlFor="dropdown">
        Tipo
      </label>
      <select 
        id="dropdown" 
        value={selectedValue} 
        onChange={(e) => setSelectedValue(e.target.value)}
        className={styles.searchSelect}
      >
        <option value="Todos">Todos Ativos</option>
        <option value="Avulso">Avulso</option>
        <option value="Lista">Lista</option>
        <option value="Mensal">Mensal</option>
        <option value="Leads">Leads</option>
        <option value="Excluso">Excluso</option>
      </select>
    </div>

    <button className={styles.btnSearch || "btnsearch"} type="submit">
      {loading ? (
        <Loader className="loadersearch" />
      ) : (
        <PiMagnifyingGlassBold style={{ fontSize: 24 }}/>
      )}{" "}
    </button>
  </form>
);
