# test_load_data.py

import os
import pandas as pd
import pytest
import logging
from io import StringIO

import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_loader import load_data  

def test_load_valid_csv(tmp_path):
    """Test that a valid CSV is loaded correctly."""
    # Create a temporary CSV file
    data = "col1,col2\n1,2\n3,4\n"
    file_path = tmp_path / "test.csv"
    file_path.write_text(data)

    df = load_data(str(file_path))

    assert isinstance(df, pd.DataFrame)
    assert not df.empty
    assert list(df.columns) == ["col1", "col2"]
    assert df.iloc[0]["col1"] == 1


def test_load_invalid_path():
    """Test that loading a non-existent file returns None."""
    df = load_data("non_existent_file.csv")
    assert df is None


def test_load_corrupt_csv(tmp_path):
    """Test that a corrupt CSV file loads with NaN values instead of failing."""
    file_path = tmp_path / "corrupt.csv"
    file_path.write_text("col1,col2\n1,2\n3")

    df = load_data(str(file_path))

    assert isinstance(df, pd.DataFrame)
    assert df.isna().any().any()  # ensure there are NaN values

