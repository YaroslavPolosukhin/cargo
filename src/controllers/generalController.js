import enumsList from "../enums/index.js";

export const getListEnums = async (req, res) => {
  try {
    return res.status(200).json({ list: enumsList });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export default { getListEnums };
